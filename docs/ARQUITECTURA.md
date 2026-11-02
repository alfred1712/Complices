# Arquitectura real de Cómplices

Fecha de revisión: 2 de noviembre de 2026. Se describe el checkout local; hosting publicado y reglas remotas tienen sus propios estados y fechas de última verificación.

## MVP activo

Cómplices es un juego de cartas para adultos. Su interfaz es una página monolítica HTML con CSS y JavaScript vanilla. La misma interfaz corre en navegador y dentro de un WebView Android. Los turnos compartidos entre dispositivos se implementan en Firebase Realtime Database (RTDB), con Firebase Authentication anónima.

```text
index5-final-v4.html (fuente canónica)
       ├── web/index.html (Firebase Hosting)
       └── android-app/app/src/main/assets/index.html (WebView local)

Web / WebView ── Firebase Auth anónima ── RTDB `juego-cruzado`
```

Las tres copias HTML deben ser idénticas en bytes. No hay compilador de frontend ni pruebas E2E configuradas. Tailwind se carga desde CDN y el SDK JavaScript usa compat 9.22.0. El mazo y la lógica principal viven en el HTML.

## Identidad visual

- El encabezado muestra `web/complices-logo-transparent.svg` sin repetir el nombre como texto; `web/complices-icon.svg` se usa como favicon SVG. Ambos recursos se copian también a `android-app/app/src/main/assets/` para que funcionen desde el HTML local de WebView.
- `web/complices-logo.svg` conserva el logo completo con fondo como recurso de marca; no se usa en el encabezado actual.
- Android declara `@mipmap/ic_complices` en `icon` y `roundIcon`. `mipmap-anydpi-v26/ic_complices.xml` usa el adaptive icon y el foreground vectorial `drawable/ic_complices_foreground.xml`, con fondo `#24151D`. Para API 23–25, `mipmap-anydpi/ic_complices.xml` compone el mismo foreground vectorial sobre el color de fondo.
- Paleta del paquete entregado: bordó `#24151D`, fondo casi negro `#100B0F`, silueta `#09080A` y dorado champagne `#D9B56D` (con degradado en SVG).
- El logo transparente de encabezado ilustra cuatro siluetas; el recurso compacto y el vector de launcher incluidos en el ZIP muestran dos figuras principales. Se conservaron estos recursos entregados tal cual; verificar si se quiere que el símbolo compacto también represente explícitamente a cuatro personas.
- Los recursos se añadieron el 2/11/2026 y se publicaron en Hosting. Se instalaron en Edge 40 Pro; una captura confirmó el logo en el encabezado del WebView. La compilación confirma que Android resuelve los recursos, pero no sustituye la inspección visual del launcher con máscaras de fabricante.

## Firebase y persistencia

- Firebase project ID: `juego-cruzado`; el endpoint RTDB está incrustado en el HTML. No cambiarlo como una tarea documental.
- Authentication: ingreso anónimo; no hay cuentas ni perfiles persistentes en servidor.
- Sala: código aleatorio de 12 caracteres. El código funciona como secreto compartido para invitar; no es una invitación mediada por backend.
- `salas/{codigo}/miembros/{uid}`: registro del UID que se incorpora.
- `salas/{codigo}/gameData`: modo, intensidad, turnos, mazo pendiente, reto actual, historial, comodines, cartas propias y cierre de partida. Lecturas en vivo y transacciones atómicas para las acciones compartidas.
- `salas/{codigo}/mazos/{mazo}/gameData`: ruta antigua que el código consulta para migración hacia `gameData`.
- `salas/{codigo}/presences/{uid}`: nombre visible y timestamp; el cliente retira su presencia con `onDisconnect`.
- `.info/connected` y `.info/serverTimeOffset`: conectividad y temporización basada en el desfase del servidor.

Las reglas activas se consultaron en modo lectura el 30/10/2026 y la documentación registra que todo miembro reconocido podía leer/escribir el objeto `gameData` entero, sin validación de campos; presencia se limita al UID propio con validaciones básicas. No se volvió a consultar el servicio el 31/10. El archivo `database.rules.fragment.json` es solo un fragmento y no está incluido en `firebase.json`; no equivale a una copia autoritativa ni se debe desplegar. El proyecto no tiene emulador RTDB configurado en el cliente.

## Hosting

`firebase.json` declara Hosting únicamente. `.firebaserc` asocia target `complices` con el sitio `complices-en-juego` y `legacy-redirect` con el sitio predeterminado `juego-cruzado`. El dominio de aplicación es `https://complices-en-juego.web.app/`; el Hosting por defecto se conserva como redirección histórica. El 2/11/2026 se publicó la identidad visual 1.21 con deploy selectivo de `hosting:complices`; HTTP respondió 200 para el HTML y los SVG de logo/favicon.

Comando autorizado y selectivo documentado: `firebase deploy --only hosting:complices --project juego-cruzado`. No incluye reglas, Functions ni target legado. El target legado solo se publica si se solicita expresamente actualizar la redirección.

## Android

- Módulo: `android-app/app`.
- Tecnología: Activity Java que crea un `WebView` y carga `file:///android_asset/index.html?nueva=1`.
- `applicationId`/namespace: `com.chispa.app` (conservar por compatibilidad).
- Checkout local: `versionName 1.21`, `versionCode 22`; `compileSdk 37`, `minSdk 23`, `targetSdk 35`, AGP 9.3.2. La identidad visual se mantiene en esta versión, sin incremento de número.
- El manifest prohíbe tráfico cleartext, declara `exported` explícito y ahora deshabilita backups. JavaScript y DOM storage están activos para el cliente; no hay `addJavascriptInterface`.
- La revisión local 1.21 deja habilitado el acceso al asset `file://` que requiere la app y niega acceso desde file a otros orígenes, a `content://` y navegación principal distinta del asset `index.html`.

La compilación `assembleDebug` 1.21 tuvo éxito con Gradle 9.7.1 y Android Studio JBR. El 2/11 se reinstaló en Edge 40 Pro; `dumpsys package` confirmó versionCode 22 y una captura mostró el logo de encabezado. No se terminó una prueba de juego porque el teléfono quedó en el panel de notificaciones. La prueba multi-dispositivo del 31/10 confirmó carta compartida, robo y avance al finalizar. No hay keystore ni firma release configuradas.

## v2 y diseños futuros

La carpeta `v2/` fue propuesta para una arquitectura diferente (Firestore, Custom Claims, App Check, Functions y otra estructura de seguridad). No es el backend activo, no forma parte del deploy del MVP y sus reglas no son compatibles automáticamente con el cliente anónimo actual. El MVP no usa esos componentes. Los documentos funcionales/negocio son propuestas e historial, no especificaciones desplegadas.

## Límites conocidos

- La confirmación de mayoría de edad es declarativa en el cliente (`sessionStorage`); no hay verificación server-side.
- El estado de partida y las cartas propias se almacenan en RTDB sin caducidad automática conocida.
- Las reglas amplias permiten alterar estado de sala por un miembro autenticado que haya entrado a ella.
- El HTML depende de CDN para Tailwind y los SDK de Firebase. No se configuró CSP porque una política no probada podría romper web o WebView.
- La mitigación XSS/WebView 1.21 y su publicación se completaron. Falta una prueba dedicada con entradas inocuas de XSS y una sesión APK–APK–Web.
