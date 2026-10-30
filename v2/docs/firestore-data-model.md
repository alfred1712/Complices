# 🗄️ Modelo de Datos Firestore v2 — Cómplices

> **Motor:** Cloud Firestore (NoSQL orientado a documentos)
> **Fecha:** Octubre 2026

---

## Resumen del Inventario Actual del Mazo

| Colección | Cantidad | Nivel | Modo |
|---|---|---|---|
| `coqueteo` (legacy ids 1-8 + supplied 101-120, 161-166) | **26 cartas** | Nivel 1 | both / pareja / grupo |
| `sensaciones` (legacy ids 11,13-16 + supplied 121-140) | **25 cartas** | Nivel 2 | both |
| `intimidad` (legacy ids 17-23 + supplied 141-192) | **52 cartas** | Nivel 3 | both / grupo |
| Comodines globales (ids 31-34) | 4 | — | both |
| Comodines por mazo (ids 201-208) | 8 | — | both |
| **TOTAL** | **~115 cartas** | | |

---

## Arquitectura General de Colecciones

```
firestore/
├── decks/                        ← Catálogo del mazo (solo lectura por clientes)
│   ├── {deckId}/                 ← "coqueteo" | "sensaciones" | "intimidad"
│   │   └── cards/                ← subcolección de cartas
│   │       └── {cardId}          ← documento de carta individual
│
├── rooms/                        ← Estado de partidas activas
│   └── {roomCode}/               ← código de 12 chars: "ABCDEF123456"
│       ├── (documento raíz)      ← metadata de la sala
│       └── history/              ← subcolección de turnos jugados
│           └── {turnId}          ← documento de turno individual
│
└── users/                        ← Perfil mínimo de usuario (opcional v2)
    └── {uid}/
        └── (documento raíz)
```

---

## Colección `decks` — Mazo de Cartas

### Documento raíz: `decks/{deckId}`

```
decks/coqueteo
decks/sensaciones
decks/intimidad
```

**Campos del documento raíz del deck:**

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `id` | `string` | `"coqueteo"` | Identificador único del mazo |
| `label` | `string` | `"Nivel 1 · Coqueteo"` | Nombre display |
| `level` | `number` | `1` | Nivel numérico (1, 2 o 3) |
| `cardCount` | `number` | `26` | Total de cartas activas |
| `createdAt` | `timestamp` | — | Fecha de creación |
| `updatedAt` | `timestamp` | — | Última modificación |
| `version` | `number` | `1` | Versión del mazo (para caché) |

### Subcolección: `decks/{deckId}/cards/{cardId}`

El `cardId` es el `id` numérico de la carta como string con padding: `"001"`, `"101"`, `"141"`.

**Campos de cada carta:**

| Campo | Tipo | Requerido | Ejemplo | Descripción |
|---|---|---|---|---|
| `id` | `number` | ✅ | `101` | ID único global de la carta |
| `cardNumber` | `number` | ✅ | `1` | Número de orden dentro del deck (para display) |
| `deckId` | `string` | ✅ | `"coqueteo"` | Referencia al deck padre |
| `type` | `string` | ✅ | `"Nivel 1"` | `"Nivel 1"` \| `"Nivel 2"` \| `"Nivel 3"` \| `"Comodín"` |
| `level` | `string` | ✅ | `"Nivel 1 · Coqueteo"` | Label display del nivel |
| `title` | `string` | ✅ | `"Mirada y caricias"` | Título de la carta |
| `desc` | `string` | ✅ | `"Mírense 5 seg..."` | Descripción para modo pareja |
| `groupDesc` | `string` | ❌ | `"En modo grupo..."` | Descripción específica para modo grupo (null si igual) |
| `mode` | `string` | ✅ | `"both"` | `"both"` \| `"pareja"` \| `"grupo"` |
| `points` | `number` | ✅ | `1` | Peso/puntos (1=Nivel1, 3=Nivel2, 5=Nivel3, 0=Comodín) |
| `active` | `boolean` | ✅ | `true` | Si la carta está activa (permite soft-delete) |
| `createdAt` | `timestamp` | ✅ | — | Fecha de creación |
| `updatedAt` | `timestamp` | ✅ | — | Última modificación |

**Ejemplo de documento completo:**
```json
// decks/coqueteo/cards/101
{
  "id": 101,
  "cardNumber": 1,
  "deckId": "coqueteo",
  "type": "Nivel 1",
  "level": "Nivel 1 · Coqueteo",
  "title": "Mirada y caricias",
  "desc": "Mírense 5 segundos; quien roba la carta acaricia la nuca de su pareja.",
  "groupDesc": "En modo grupo, quien roba elige a otra persona del grupo, cruzan una mirada breve y le acaricia la nuca.",
  "mode": "both",
  "points": 1,
  "active": true,
  "createdAt": "2026-10-29T17:00:00Z",
  "updatedAt": "2026-10-29T17:00:00Z"
}
```

---

## Colección `rooms` — Estado de las Partidas

### Documento raíz: `rooms/{roomCode}`

El `roomCode` es el código de 12 caracteres alfanuméricos (ej: `"ABCDEF234567"`).

**Campos del documento raíz de sala:**

| Campo | Tipo | Requerido | Ejemplo | Descripción |
|---|---|---|---|---|
| `roomCode` | `string` | ✅ | `"ABCDEF234567"` | Código de sala (igual al ID del documento) |
| `gameMode` | `string` | ✅ | `"pareja"` | `"pareja"` \| `"grupo"` |
| `intensityLimit` | `number` | ✅ | `3` | Nivel máximo habilitado (1, 2 o 3) |
| `deckVersion` | `number` | ✅ | `11` | Versión del mazo activo (para migración) |
| `status` | `string` | ✅ | `"active"` | `"active"` \| `"finished"` \| `"abandoned"` |
| `currentCard` | `map\|null` | ✅ | `{...}` o `null` | Carta activa en este turno (null = sin carta) |
| `availableCardIds` | `array<number>` | ✅ | `[101, 102, ...]` | IDs de cartas aún no jugadas |
| `wildcardUsage` | `map<string,number>` | ✅ | `{"Ana": 1}` | Comodines usados por jugador |
| `scores` | `map<string,number>` | ✅ | `{"Ana": 3}` | Puntos por jugador (legacy, opcional) |
| `members` | `map<string,boolean>` | ✅ | `{"uid123": true}` | UIDs de miembros activos de la sala |
| `createdAt` | `timestamp` | ✅ | — | Cuándo se creó la sala |
| `lastActivityAt` | `timestamp` | ✅ | — | Última actividad (para limpieza automática) |

**Estructura de `currentCard` (mapa embebido):**

| Campo | Tipo | Ejemplo |
|---|---|---|
| `id` | `number` | `141` |
| `deckId` | `string` | `"intimidad"` |
| `type` | `string` | `"Nivel 3"` |
| `title` | `string` | `"Mano bajo la camiseta"` |
| `drawnBy` | `string` | `"Ana"` |
| `drawnByUid` | `string` | `"uid_abc123"` |
| `drawnAt` | `timestamp` | — |

> **¿Por qué embebido y no referencia?** La carta activa necesita leerse con el documento de sala en una sola operación. Al ser un mapa embebido, el listener en tiempo real recibe carta + estado de sala en un solo snapshot.

### Subcolección: `rooms/{roomCode}/history/{turnId}`

El `turnId` se genera con `crypto.randomUUID()` o `db.collection().doc().id`.

**Campos de cada turno:**

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `turnId` | `string` | `"abc123"` | ID del turno (igual al ID del documento) |
| `cardId` | `number` | `141` | ID de la carta jugada |
| `deckId` | `string` | `"intimidad"` | Mazo de la carta |
| `title` | `string` | `"Mano bajo la camiseta"` | Título de la carta |
| `level` | `string` | `"Nivel 3 · Intimidad"` | Nivel display |
| `type` | `string` | `"Nivel 3"` | Tipo de carta |
| `player` | `string` | `"Ana"` | Nombre del jugador que la robó |
| `playerUid` | `string` | `"uid_abc123"` | UID del jugador |
| `status` | `string` | `"completed"` | `"completed"` \| `"skipped"` \| `"wildcard"` |
| `playedAt` | `timestamp` | — | Cuándo se jugó |

---

## Colección `users` — Perfil de Usuario (Fase 2)

> Esta colección es opcional en v2 inicial. Se activa cuando se implemente autenticación persistente (Google Sign-In). En la fase actual con Auth Anónima, no es necesaria.

### Documento: `users/{uid}`

| Campo | Tipo | Descripción |
|---|---|---|
| `uid` | `string` | UID de Firebase Auth |
| `displayName` | `string` | Nombre visible en la app |
| `adultConfirmed` | `boolean` | Confirmación de edad (redundante con custom claim, para auditoría) |
| `adultConfirmedAt` | `timestamp` | Cuándo confirmó la edad |
| `lastSeenAt` | `timestamp` | Última actividad |
| `createdAt` | `timestamp` | Registro inicial |

---

## Reglas de Seguridad Firestore v2

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ─────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdultConfirmed() {
      return request.auth.token.adultConfirmed == true;
    }

    function isRoomMember(roomCode) {
      return isAuthenticated()
        && isAdultConfirmed()
        && get(/databases/$(database)/documents/rooms/$(roomCode)).data.members[request.auth.uid] == true;
    }

    function isValidCardStatus() {
      return request.resource.data.status in ['completed', 'skipped', 'wildcard'];
    }

    function isValidGameMode() {
      return request.resource.data.gameMode in ['pareja', 'grupo'];
    }

    function isValidIntensity() {
      return request.resource.data.intensityLimit is int
        && request.resource.data.intensityLimit >= 1
        && request.resource.data.intensityLimit <= 3;
    }

    // ── Mazo de cartas ───────────────────────────────────────────
    // Solo adultos autenticados pueden leer. Nadie puede escribir desde el cliente.
    match /decks/{deckId} {
      allow read: if isAuthenticated() && isAdultConfirmed();
      allow write: if false; // Solo Cloud Functions / Admin SDK

      match /cards/{cardId} {
        allow read: if isAuthenticated() && isAdultConfirmed();
        allow write: if false;
      }
    }

    // ── Salas de juego ───────────────────────────────────────────
    match /rooms/{roomCode} {
      // Cualquier adulto autenticado puede CREAR una sala nueva
      allow create: if isAuthenticated()
        && isAdultConfirmed()
        && isValidGameMode()
        && isValidIntensity()
        && request.resource.data.members[request.auth.uid] == true
        && request.resource.data.status == 'active';

      // Solo miembros adultos de la sala pueden LEER
      allow read: if isRoomMember(roomCode);

      // Solo miembros adultos pueden ACTUALIZAR — con validaciones de campos
      allow update: if isRoomMember(roomCode)
        && isValidGameMode()
        && isValidIntensity()
        && request.resource.data.deckVersion is int
        && request.resource.data.status in ['active', 'finished', 'abandoned']
        // No se puede cambiar createdAt una vez creado
        && request.resource.data.createdAt == resource.data.createdAt;

      // Nadie puede borrar salas desde el cliente
      allow delete: if false;

      // ── Historial de turnos ────────────────────────────────────
      match /history/{turnId} {
        // Miembros pueden leer todo el historial
        allow read: if isRoomMember(roomCode);

        // Miembros pueden crear su propio registro de turno
        allow create: if isRoomMember(roomCode)
          && request.resource.data.playerUid == request.auth.uid
          && isValidCardStatus()
          && request.resource.data.playedAt == request.time;

        // Nadie puede editar ni borrar el historial
        allow update, delete: if false;
      }
    }

    // ── Usuarios ─────────────────────────────────────────────────
    match /users/{uid} {
      allow read:   if isAuthenticated() && request.auth.uid == uid;
      allow create: if isAuthenticated() && request.auth.uid == uid && isAdultConfirmed();
      allow update: if isAuthenticated() && request.auth.uid == uid
        // No se puede modificar adultConfirmed ni adultConfirmedAt desde el cliente
        && !('adultConfirmed' in request.resource.data.diff(resource.data).affectedKeys())
        && !('adultConfirmedAt' in request.resource.data.diff(resource.data).affectedKeys());
      allow delete: if false;
    }
  }
}
```

---

## Comparativa v1 (RTDB) vs v2 (Firestore)

| Aspecto | v1 — Realtime DB | v2 — Firestore |
|---|---|---|
| **Mazo** | Hardcodeado en el HTML | Colección `decks/` protegida por auth |
| **Estado de sala** | Un único nodo JSON plano | Documento tipado con validación por campo |
| **Historial** | Array embebido (crece sin límite) | Subcolección `history/` (paginable) |
| **Presencias** | Nodo `presences/` + setInterval | Igual (se conserva en RTDB; Firestore no soporta onDisconnect nativo) |
| **Reglas** | `.validate` básico, sin tipos | `rules_version='2'` con helpers y tipado |
| **Actualizar carta** | Redistribuir APK | Editar documento en Firebase Console |
| **Consultas** | Limitadas (solo por clave) | Queries compuestos, filtros, orderBy |
| **Offline** | Soporte nativo | Soporte nativo + caché persistente |

> **Nota arquitectónica:** Las **presencias en tiempo real** (`onDisconnect`) siguen usando Realtime Database porque Firestore no tiene soporte nativo equivalente. La sala de juego principal migra a Firestore.

---

## Estrategia de Índices Firestore

```
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "cards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "deckId",  "order": "ASCENDING" },
        { "fieldPath": "type",    "order": "ASCENDING" },
        { "fieldPath": "mode",    "order": "ASCENDING" },
        { "fieldPath": "active",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "history",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "playerUid", "order": "ASCENDING" },
        { "fieldPath": "playedAt",  "order": "DESCENDING" }
      ]
    }
  ]
}
```

**¿Para qué sirven?**
- **Índice de cards:** Permite consultas como `WHERE deckId='coqueteo' AND type='Nivel 1' AND mode IN ['both','pareja'] AND active=true` para filtrar el mazo según modo e intensidad.
- **Índice de history:** Permite paginar el historial de un jugador específico ordenado por fecha.

---

## Plan de Migración de Datos (v1 → v2)

```
FASE 1 — Seed del mazo en Firestore (script seed.js)
  ↓
FASE 2 — La Cloud Function drawCard lee cartas desde Firestore
          en lugar de recibirlas del cliente
  ↓
FASE 3 — El cliente descarga el mazo completo al inicio
          y lo cachea localmente (Firestore offline cache)
  ↓
FASE 4 — El estado de sala migra de RTDB gameData a Firestore rooms/
          (RTDB solo conserva presences/)
  ↓
FASE 5 — La app Android nativa reemplaza el WebView
          y consume Firestore directamente con el SDK de Android
```

---

*Documento generado por: Antigravity (Arquitecto AI Senior) — Octubre 2026*
