# 🔒 Guía de Implementación de Seguridad v2

> Cubre los 4 puntos críticos del roadmap: SEC-1, SEC-2, SEC-3, SEC-4

---

## SEC-1 — Firebase App Check

**Qué resuelve:** Impide que scripts externos usen tu `apiKey` para autenticarse como si fueran la app oficial.

### Pasos en Firebase Console

1. Ir a **Build → App Check** en Firebase Console.
2. Registrar la **app web** con proveedor **reCAPTCHA v3**:
   - Obtener la site key en [google.com/recaptcha](https://www.google.com/recaptcha/admin).
   - Pegarla en App Check → registrar app.
3. Registrar la **app Android** con proveedor **Play Integrity**:
   - Requiere que la app esté publicada en Google Play (o usar Debug Provider en desarrollo).
   - En Firebase Console → App Check → Android → Play Integrity.
4. En **Realtime Database**, hacer clic en **"Enforce"** (no solo Monitor).
5. En **Cloud Functions** las funciones ya tienen `enforceAppCheck: true` en el código.

### Cambio en el cliente web (index.html → v2)

```javascript
// Agregar ANTES de firebase.initializeApp()
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("TU_RECAPTCHA_SITE_KEY"),
  isTokenAutoRefreshEnabled: true,
});
```

> **En desarrollo local:** Para no bloquear el emulador, usar:
> `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;` antes de inicializar.

---

## SEC-2 — Verificación de Edad con Server-Side Token

**Qué resuelve:** La "puerta de adultos" pasa del cliente (bypasseable) al servidor (infalsificable).

### Flujo completo

```
Usuario toca "Tengo 18+" 
       ↓
Cliente llama: confirmAdultAndGetToken({ uid })  [Cloud Function]
       ↓
Cloud Function agrega claim { adultConfirmed: true } al usuario en Firebase Auth
Cloud Function devuelve un customToken
       ↓
Cliente hace: auth.signInWithCustomToken(customToken)
       ↓
A partir de aquí: auth.token.adultConfirmed === true en todas las operaciones
       ↓
Las reglas de Realtime DB validan ese claim en CADA lectura/escritura
```

### Cambio en el cliente (flujo de adultGate)

```javascript
// ANTES (v1) — solo sessionStorage, bypasseable
adultConfirmBtn.addEventListener('click', () => {
    sessionStorage.setItem('chispa_adult_confirmed', 'yes');
    adultGate.classList.add('hidden');
});

// DESPUÉS (v2) — validado por servidor
adultConfirmBtn.addEventListener('click', async () => {
    adultConfirmBtn.disabled = true;
    adultConfirmBtn.textContent = 'Verificando…';
    try {
        // 1. Autenticación anónima primero
        const credential = await auth.signInAnonymously();
        // 2. Llamar a la Cloud Function para obtener custom token con claim adulto
        const confirmFn = firebase.functions().httpsCallable('confirmAdultAndGetToken');
        const result = await confirmFn({});
        // 3. Iniciar sesión con el custom token que tiene el claim adultConfirmed: true
        await auth.signInWithCustomToken(result.data.token);
        // 4. Ocultar la puerta — ahora el usuario tiene el claim en su token
        adultGate.classList.add('hidden');
    } catch (error) {
        console.error('Error verificando edad:', error);
        adultConfirmBtn.disabled = false;
        adultConfirmBtn.textContent = 'Tengo 18 años o más · Continuar';
        showToast('No se pudo verificar. Intenta de nuevo.', 'error');
    }
});
```

> **Nota importante:** El claim `adultConfirmed: true` es permanente para ese UID anónimo. Si el usuario borra los datos de la app y se crea un nuevo UID anónimo, deberá volver a confirmar. Esto es el comportamiento correcto.

---

## SEC-3 — Configuración de Firebase en Variables de Entorno

**Qué resuelve:** La `apiKey` y credenciales dejan de vivir en el código fuente del cliente.

### Para la app Web (con Vite)

```bash
# Archivo: v2/web/.env.local  (nunca commitear en git)
VITE_FIREBASE_API_KEY=AIzaSyBYXICYKd8lJLwwgSLR3-KIsfFiyvmyFiU
VITE_FIREBASE_AUTH_DOMAIN=juego-cruzado.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://juego-cruzado-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=juego-cruzado
VITE_FIREBASE_STORAGE_BUCKET=juego-cruzado.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=76826915440
VITE_FIREBASE_APP_ID=1:76826915440:web:aab5727144c4a038cc3ab5
```

```javascript
// firebaseConfig.js
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### Para la app Android (Kotlin/Compose en v2)

En Android, la config va en `google-services.json` (que ya es un archivo separado del código fuente). Agregar al `.gitignore`:
```
android-app/app/google-services.json
```

Y para claves adicionales, usar `local.properties`:
```properties
# local.properties (ya en .gitignore por defecto)
RECAPTCHA_SITE_KEY=TU_CLAVE_AQUI
```

Leerlo en `build.gradle.kts`:
```kotlin
val localProperties = Properties().apply {
    load(rootProject.file("local.properties").inputStream())
}
android {
    defaultConfig {
        buildConfigField("String", "RECAPTCHA_SITE_KEY",
            "\"${localProperties["RECAPTCHA_SITE_KEY"]}\"")
    }
}
```

### Restricción de API Key en Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Seleccionar la API Key del proyecto `juego-cruzado`.
3. En **Application restrictions**:
   - Para Web: `HTTP referrers` → agregar `juego-cruzado.web.app/*` y `juego-cruzado.firebaseapp.com/*`.
   - Para Android: `Android apps` → agregar el SHA-1 del keystore de producción.
4. En **API restrictions**: limitar solo a las APIs usadas (Firebase Realtime Database, Identity Toolkit).

---

## SEC-4 — Reglas de Realtime Database con `.validate` Completo

**Qué resuelve:** Ningún cliente puede escribir datos malformados o corromper el estado del juego.

### Archivo generado

Ver [`v2/firebase/rules/database.rules.json`](../firebase/rules/database.rules.json)

### Resumen de validaciones implementadas

| Nodo | Validación |
|---|---|
| `miembros/$uid` | Solo `true`, solo el propio UID, solo adultos confirmados |
| `gameData.deckVersion` | Número entre 1 y 100 |
| `gameData.gameMode` | Solo `'pareja'` o `'grupo'` |
| `gameData.intensityLimit` | Solo 1, 2 o 3 |
| `gameData.currentCard` | `null` o estructura completa con campos requeridos y longitudes máximas |
| `gameData.availableCards.$idx` | ID numérico, deckId válido, título ≤ 120 chars |
| `gameData.history.$idx` | Campos requeridos, status enum estricto, longitudes máximas |
| `gameData.wildcardUsage.$name` | Número entre 0 y 10 |
| `presences.$uid` | Solo el propio UID, sin campos sensibles (uid, email, phone), ts numérico |
| `mazos.$deck.gameData` | Solo lectura para migración, sin escritura nueva |

### Cómo desplegar las reglas

```bash
# Desde el directorio v2/firebase/
firebase use juego-cruzado
firebase deploy --only database
```

---

## Checklist de Verificación Final

- [ ] App Check activado en Firebase Console (modo Enforce, no Monitor)
- [ ] reCAPTCHA v3 site key registrada para web
- [ ] Play Integrity registrado para Android
- [ ] Cloud Functions desplegadas: `confirmAdultAndGetToken` y `drawCard`
- [ ] Reglas de Realtime Database desplegadas desde `database.rules.json`
- [ ] `apiKey` restringida en Google Cloud Console por dominio y SHA-1
- [ ] `.env.local` y `google-services.json` en `.gitignore`
- [ ] Flujo del cliente actualizado para usar `signInWithCustomToken`
- [ ] Probado con Firebase Emulator Suite antes de ir a producción

---

*Documento generado por: Antigravity (Arquitecto AI Senior) — Octubre 2026*
