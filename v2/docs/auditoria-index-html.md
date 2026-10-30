# 🔍 Auditoría Técnica — `index.html` (Versión Actual)

> **Archivo analizado:** `android-app/app/src/main/assets/index.html` (1405 líneas)
> **Fecha:** Octubre 2026

---

## 1. Resumen Ejecutivo

La app completa vive en **un único archivo HTML monolítico de 1405 líneas** que combina HTML, CSS, JavaScript, datos del mazo y configuración de Firebase. La app Android es un WebView wrapper de 13 líneas que carga ese HTML desde los assets.

**Calificación arquitectónica: ⚠️ 2.5 / 5** — Funcional como MVP, con deuda técnica crítica.

---

## 2. Stack Tecnológico Real Detectado

| Componente | Tecnología | Versión |
|---|---|---|
| UI Framework | Tailwind CSS (CDN) | Sin versión fija |
| Backend | Firebase Realtime Database | 9.22.0 compat |
| Auth | Firebase Auth Anónima | 9.22.0 compat |
| Lógica | JavaScript vanilla | ES2020+ |
| Android | WebView en MainActivity.java | — |

---

## 3. 🔴 Hallazgos de Seguridad

### 3.1 CRÍTICO — API Key expuesta en texto plano
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBYXICYKd8lJLwwgSLR3-KIsfFiyvmyFiU", // ⚠️ VISIBLE EN FUENTE
    databaseURL: "https://juego-cruzado-default-rtdb.firebaseio.com",
    appId: "1:76826915440:web:aab5727144c4a038cc3ab5",
};
```
**Riesgo:** Cualquiera puede extraer la config descompilando el APK o inspeccionando el código web. Sin App Check, cualquier script puede autenticarse como si fuera la app oficial.

**Solución v2:** Activar **Firebase App Check** + restringir la API Key en Google Cloud Console por dominio/SHA de app.

---

### 3.2 ALTO — Verificación de edad bypasseable desde DevTools
```javascript
// Solo sessionStorage del cliente — sin validación de servidor
if (sessionStorage.getItem('chispa_adult_confirmed') === 'yes') {
    adultGate.classList.add('hidden');
}
```
**Riesgo:** Un menor puede saltarla con `sessionStorage.setItem('chispa_adult_confirmed', 'yes')` en consola, o accediendo directamente con `?sala=XXXX`.

**Solución v2:** Cloud Function que emite un custom token con claim `{ adultConfirmed: true }`. Las reglas de Realtime DB validan ese claim antes de permitir lectura/escritura.

---

### 3.3 ALTO — Las reglas de Firebase no validan estructura de datos
```json
// database.rules.fragment.json
"gameData": {
    ".write": "auth != null && root.child('salas').child($room)..."
    // SIN .validate → cualquier miembro puede escribir cualquier estructura
}
```
**Riesgo:** Cualquier jugador autenticado de la sala puede reescribir `gameData` completo con cualquier payload, corrompiendo el estado, borrando historial o seteando comodines de otros.

**Solución v2:** Agregar `.validate` campo por campo. Separar `wildcardUsage` por UID en lugar de por nombre de jugador.

---

### 3.4 MEDIO — Nombre de jugador sin sanitización → potencial XSS
```javascript
let localPlayerName = localStorage.getItem('fuegoCruzado_localPlayer') || "";
// Renderizado sin escapar en template literals
`<strong>${playerName}</strong>`
```

---

## 4. ⚠️ Hallazgos de Arquitectura

### 4.1 Archivo monolítico de 1405 líneas — sin separación de concerns

| Sección | Líneas aprox. |
|---|---|
| HTML + estructura UI | ~320 |
| CSS inline `<style>` | ~95 |
| Datos del mazo hardcodeado (`const deck = [...]`) | ~450 |
| Lógica Firebase y estado | ~250 |
| Renderizado y eventos | ~290 |

**Consecuencias:** Imposible testear, imposible reutilizar lógica entre web y Android nativo, cada fix toca producción directamente.

---

### 4.2 CRÍTICO — La carta se elige en el cliente ANTES de la transacción Firebase

```javascript
// El cliente elige la carta localmente...
const winner = pickWeightedCard(available, drawsSoFar);
// ...y luego compite por escribirla en Firebase
updateGameState((state) => { state.currentCard = winner; });
```

**Problema:** Si dos jugadores pulsan "Girar" simultáneamente, cada uno elige una carta diferente localmente. El que pierde la transacción ve la animación con una carta que no es la que finalmente quedó activa.

**Solución v2:** La selección de carta ocurre **dentro de una Cloud Function**, nunca en el cliente.

---

### 4.3 Mazo de ~100 cartas hardcodeado en el cliente

```javascript
const deck = [ { id: 1, deckId: 'coqueteo', ... }, /* ~100 objetos */ ];
```

**Problemas:**
- Actualizar una carta = redistribuir APK completo.
- El contenido de Nivel 3 es visible en el fuente sin autenticación.
- La lógica de `reconcileSharedDeck()` con `deckVersion: 11` es deuda técnica de migraciones manuales sucesivas.

**Solución v2:** Mazo en Firestore, protegido por auth + claim `adultConfirmed`, con caché local.

---

### 4.4 10+ variables de estado globales mutables sin patrón de gestión

```javascript
let gameState, localPlayerName, activeDeck, TOTAL_CARDS;
let roomReady, isOnline, rouletteActive, presences;
let presenceDisconnectArmed, hasObservedInitialGameState, previousCardWasActive;
```

Cualquier función puede mutar cualquier variable. Sin estructura, el flujo es difícil de razonar y propenso a bugs de estado stale.

---

### 4.5 Polling de presencia con `setInterval` cada 5 segundos

```javascript
setInterval(syncPresence, 5000); // ~720 escrituras en una sesión de 1 hora
```

---

## 5. 🟡 Hallazgos de Rendimiento

| # | Problema | Impacto |
|---|---|---|
| PERF-1 | Tailwind CDN (~300KB, compila en browser) | Lentitud en primer render |
| PERF-2 | 3 scripts Firebase compat bloqueantes en `<head>` | Retrasa parsing del HTML |
| PERF-3 | `pickWeightedCard()` llamada ~100 veces en la animación de ruleta | Jank en dispositivos de gama baja |
| PERF-4 | Sin caché local del mazo | Falla si no hay conexión al inicio |

---

## 6. ✅ Buenas Prácticas a Conservar en v2

| Práctica | Detalle |
|---|---|
| `gameRef.transaction()` | Previene race conditions en tiradas simultáneas |
| `onDisconnect().remove()` | Limpia presencia automáticamente al desconectarse |
| ARIA labels en UI | `role`, `aria-live`, `aria-label` presentes |
| `drawLevelWeights()` | Progresión gradual de niveles, elegante y configurable |
| Validación de código de sala | Regex `^[A-Z0-9]{12}$` estricta |
| Comodín condicional | Solo cancela cartas de Nivel 2 y 3, lógica correcta |

---

## 7. Roadmap Priorizado para v2

```
🔴 CRÍTICO — Seguridad
  [SEC-1] Activar Firebase App Check
  [SEC-2] Verificación de edad con server-side token (Cloud Function)
  [SEC-3] Mover config Firebase a variables de entorno de build
  [SEC-4] Agregar .validate en todas las reglas de Realtime DB

🟠 ALTO — Arquitectura
  [ARCH-1] Mazo de cartas → Firestore (acceso protegido por auth + claim)
  [ARCH-2] Selección de carta → Cloud Function (no en el cliente)
  [ARCH-3] Separar en módulos: data / domain / ui
  [ARCH-4] Store de estado: ViewModel+StateFlow (Android) / Zustand (Web)

🟡 MEDIO — Rendimiento
  [PERF-1] Eliminar Tailwind CDN → build con Vite para web
  [PERF-2] Migrar Firebase a SDK modular (tree-shakeable)
  [PERF-3] Eliminar setInterval de presencia → solo onDisconnect nativo
  [PERF-4] Animación de ruleta con requestAnimationFrame

🟢 BAJO — UX / Deuda técnica
  [UX-1] Migrar Android a Jetpack Compose nativo
  [UX-2] Modo offline con caché del mazo en Room/DataStore
  [UX-3] Tests unitarios para lógica de pesos y selección de carta
```

---

*Auditoría generada por: Antigravity (Arquitecto AI Senior) — Octubre 2026*
