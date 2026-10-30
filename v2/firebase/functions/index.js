/**
 * Cloud Functions v2 — Cómplices
 *
 * Funciones:
 *   1. confirmAdultAndGetToken  — verifica edad y emite un custom token
 *                                  con claim { adultConfirmed: true }
 *   2. drawCard                 — selecciona la carta dentro de una
 *                                  transacción segura del lado del servidor
 *
 * Deploy: firebase deploy --only functions
 */

const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.database();
const auth = admin.auth();

// ============================================================
// CONSTANTES
// ============================================================
const ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12}$/;
const MAX_PLAYER_NAME_LENGTH = 40;
const DECK_IDS = ["coqueteo", "sensaciones", "intimidad"];
const CORS_ORIGINS = [
  "https://juego-cruzado.web.app",
  "https://juego-cruzado.firebaseapp.com",
];

// ============================================================
// FUNCIÓN 1: confirmAdultAndGetToken
//
// El cliente llama a esta función DESPUÉS de que el usuario
// confirma tener 18+ años. La función:
//   1. Valida que el uid sea un usuario Firebase Auth válido
//   2. Agrega el custom claim { adultConfirmed: true }
//   3. Devuelve un custom token para que el cliente haga
//      signInWithCustomToken() y obtenga el claim en su token
//
// El cliente NUNCA auto-asigna este claim. Solo esta función puede hacerlo.
// ============================================================
exports.confirmAdultAndGetToken = functions.onCall(
  { cors: CORS_ORIGINS, enforceAppCheck: true },
  async (request) => {
    const uid = request.auth?.uid;

    // Solo usuarios ya autenticados anónimamente pueden llamar esto
    if (!uid) {
      throw new functions.HttpsError(
        "unauthenticated",
        "Debes iniciar sesión antes de confirmar tu edad."
      );
    }

    // Verificar que el usuario existe en Firebase Auth
    try {
      await auth.getUser(uid);
    } catch {
      throw new functions.HttpsError(
        "not-found",
        "Usuario no encontrado en el sistema de autenticación."
      );
    }

    // Agregar el custom claim permanente al usuario
    await auth.setCustomUserClaims(uid, { adultConfirmed: true });

    // Emitir un custom token para que el cliente pueda refrescar su sesión
    // y obtener el claim en el ID token actualizado
    const customToken = await auth.createCustomToken(uid, {
      adultConfirmed: true,
    });

    return { token: customToken };
  }
);

// ============================================================
// FUNCIÓN 2: drawCard
//
// Selecciona una carta de forma segura en el servidor.
// El cliente envía: { roomCode, playerName, drawsSoFar }
// El servidor ejecuta la transacción en Firebase RTDB y
// devuelve la carta seleccionada.
//
// Esto elimina el bug donde dos clientes eligen cartas
// diferentes localmente y compiten en la transacción.
// ============================================================
exports.drawCard = functions.onCall(
  { cors: CORS_ORIGINS, enforceAppCheck: true },
  async (request) => {
    const uid = request.auth?.uid;
    const isAdult = request.auth?.token?.adultConfirmed === true;

    // Validar autenticación y claim de adulto
    if (!uid || !isAdult) {
      throw new functions.HttpsError(
        "permission-denied",
        "Solo usuarios adultos verificados pueden robar una carta."
      );
    }

    const { roomCode, playerName, drawsSoFar } = request.data;

    // Validar inputs
    if (!roomCode || !ROOM_CODE_REGEX.test(roomCode)) {
      throw new functions.HttpsError("invalid-argument", "Código de sala inválido.");
    }
    if (
      !playerName ||
      typeof playerName !== "string" ||
      playerName.trim().length === 0 ||
      playerName.trim().length > MAX_PLAYER_NAME_LENGTH
    ) {
      throw new functions.HttpsError("invalid-argument", "Nombre de jugador inválido.");
    }
    if (typeof drawsSoFar !== "number" || drawsSoFar < 0) {
      throw new functions.HttpsError("invalid-argument", "drawsSoFar debe ser un número >= 0.");
    }

    const gameRef = db.ref(`salas/${roomCode}/gameData`);
    const memberRef = db.ref(`salas/${roomCode}/miembros/${uid}`);

    // Verificar que el usuario es miembro de la sala
    const memberSnap = await memberRef.once("value");
    if (memberSnap.val() !== true) {
      throw new functions.HttpsError(
        "permission-denied",
        "No eres miembro de esta sala."
      );
    }

    let drawnCard = null;
    let errorReason = null;

    // Ejecutar la selección de carta DENTRO de la transacción del servidor
    await gameRef.transaction((current) => {
      if (!current) {
        errorReason = "no-game-state";
        return current;
      }
      if (current.currentCard) {
        errorReason = "card-already-active";
        return current; // Abortar sin cambios
      }

      const availableCards = listFromFirebase(current.availableCards).filter(
        (c) => c.type !== "Comodín"
      );

      if (availableCards.length === 0) {
        errorReason = "deck-empty";
        return current;
      }

      // La selección ponderada ocurre AQUÍ, en el servidor
      const winner = pickWeightedCard(availableCards, drawsSoFar);
      if (!winner) {
        errorReason = "no-winner";
        return current;
      }

      const newAvailable = availableCards.filter(
        (c) => !(Number(c.id) === Number(winner.id) && c.deckId === winner.deckId)
      );

      drawnCard = {
        ...winner,
        drawnBy: playerName.trim(),
        drawnByUid: uid,
      };

      return {
        ...current,
        availableCards: newAvailable,
        currentCard: drawnCard,
      };
    });

    if (errorReason) {
      const messages = {
        "no-game-state": "La sala no tiene estado de juego inicializado.",
        "card-already-active": "Ya hay una carta activa en esta sala.",
        "deck-empty": "El mazo está vacío. Reinicia la partida.",
        "no-winner": "No se pudo seleccionar una carta. Intenta de nuevo.",
      };
      throw new functions.HttpsError(
        "failed-precondition",
        messages[errorReason] || "Error desconocido."
      );
    }

    return { card: drawnCard };
  }
);

// ============================================================
// HELPERS (espejo de la lógica del cliente, ahora en servidor)
// ============================================================

function listFromFirebase(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.values(value);
}

function drawLevelWeights(drawsSoFar) {
  if (drawsSoFar === 0) return { coqueteo: 0.75, sensaciones: 0.25, intimidad: 0 };
  if (drawsSoFar < 3) return { coqueteo: 0.55, sensaciones: 0.45, intimidad: 0 };
  if (drawsSoFar < 6) return { coqueteo: 0.35, sensaciones: 0.5, intimidad: 0.15 };
  return { coqueteo: 0.25, sensaciones: 0.35, intimidad: 0.4 };
}

function pickWeightedCard(cards, drawsSoFar) {
  if (!cards.length) return null;
  const weights = drawLevelWeights(drawsSoFar);
  const availableDeckIds = [...new Set(cards.map((c) => c.deckId || "coqueteo"))];
  const eligibleDecks = availableDeckIds
    .map((deckId) => ({ deckId, weight: weights[deckId] || 0 }))
    .filter((d) => d.weight > 0);
  const totalWeight = eligibleDecks.reduce((s, d) => s + d.weight, 0);

  if (!totalWeight) return cards[Math.floor(Math.random() * cards.length)];

  let roll = Math.random() * totalWeight;
  let chosenDeckId = eligibleDecks[eligibleDecks.length - 1].deckId;
  for (const option of eligibleDecks) {
    roll -= option.weight;
    if (roll < 0) { chosenDeckId = option.deckId; break; }
  }

  const levelCards = cards.filter((c) => (c.deckId || "coqueteo") === chosenDeckId);
  return levelCards[Math.floor(Math.random() * levelCards.length)];
}
