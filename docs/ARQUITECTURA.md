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

- El encabezado muestra `complices-logo-banner-blended.png`, una versión sin el fondo cuadriculado opaco de la imagen elegida por el usuario; sus trazos dorados quedan sobre el propio fondo de la app. El mismo PNG está en `web/` y en `android-app/app/src/main/assets/`, y se referencia desde las tres copias idénticas del HTML canónico. `web/complices-icon.svg` continúa como favicon SVG.
- `web/complices-logo.svg` conserva el logo completo con fondo como recurso de marca; no se usa en el encabezado actual.
- Android declara `@mipmap/ic_complices` en `icon` y `roundIcon`. El recurso `drawable-nodpi/complices_launcher.png` adapta la imagen preferida por el usuario (corazón, dos parejas y wordmark dorado) a un lienzo cuadrado bordó. `mipmap-anydpi-v26/ic_complices.xml` la usa como foreground del adaptive icon; para API 23–25, `mipmap-anydpi/ic_complices.xml` la compone sobre el color de fondo. El anterior foreground vectorial se conserva en recursos como respaldo, aunque ya no es el launcher activo.
- Paleta del paquete entregado: bordó `#24151D`, fondo casi negro `#100B0F`, silueta `#09080A` y dorado champagne `#D9B56D` (con degradado en SVG).
- El logo transparente de encabezado ilustra cuatro siluetas; el favicon SVG compacto y el vector antiguo de launcher muestran dos figuras principales. El launcher activo usa ahora `drawable-nodpi/complices_launcher.png`, adaptado de la imagen elegida por el usuario con dos parejas, corazón y wordmark.
- El launcher actualizado se compiló e instaló en Edge 40 Pro el 2/11; una captura del cajón de aplicaciones mostró el icono completo sin recorte bajo la máscara Motorola. El encabezado usa la misma ilustración integrada en web y APK. El encabezado actualizado se compiló e instaló en Edge 40 Pro y se publicó solo en `hosting:complices` el 2/11; HTTP confirmó el HTML y PNG nuevos con hash idéntico al recurso local. No se confirmó la captura visual de la última instalación porque el teléfono estaba bloqueado.

## Firebase y persistencia

- Firebase project ID: `juego-cruzado`; el endpoint RTDB está incrustado en el HTML. No cambiarlo como una tarea documental.
- Authentication: ingreso anónimo; no hay cuentas ni perfiles persistentes en servidor.
- Sala: código aleatorio de 12 caracteres. El código funciona como secreto compartido para invitar; no es una invitación mediada por backend.
- `salas/{codigo}/miembros/{uid}`: registro del UID que se incorpora.
- `salas/{codigo}/gameData`: modo, intensidad, turnos, mazo pendiente, reto actual, historial, favoritos de sesión, modificador de accesorios, comodines, cartas propias y cierre de partida. Lecturas en vivo y transacciones atómicas para las acciones compartidas.
- `salas/{codigo}/gameData/favorites`: mapa de claves estables a snapshots de cartas favoritas, compartido por la sala y actualizado mediante transacciones de `gameData`.
- `salas/{codigo}/gameData/accessoriesEnabled`: ajuste común; al robar cartas de Nivel 2/3 el cliente guarda el modificador elegido dentro de `currentCard.accessoryModifier` para que todas las vistas rendericen el mismo texto.
- En modo Grupo, `currentCard.executor` y `currentCard.targetPlayer` guardan UID y nombre elegidos entre presencias activas, siempre distintos y mutuamente compatibles con sexo/orientación declarados. No hay relaciones de pareja registradas: asigna personas individuales, no parejas inferidas.
- `salas/{codigo}/mazos/{mazo}/gameData`: ruta antigua que el código consulta para migración hacia `gameData`.
- `salas/{codigo}/presences/{uid}`: nombre visible, timestamp y, si la persona lo guarda, `sex` (`hombre`, `mujer` o `no-indicar`) y `orientation` (`heterosexual`, `bisexual`, `gay`, `pansexual`, `abierta` o `no-indicar`). Es información temporal visible a los miembros de la sala mientras está conectada; el cliente retira el nodo con `onDisconnect`. Las preferencias se recuerdan localmente por código de sala.
- La ruleta requiere dos perfiles mutuamente compatibles. Heterosexual acepta el género distinto; gay/lesbiana, el mismo; bisexual, pansexual y abierta, cualquiera de los dos. La compatibilidad se evalúa en ambos sentidos. Perfiles incompletos o con «Prefiero no indicar» quedan fuera de la asignación aleatoria. Es un filtro del cliente, no una garantía impuesta por reglas RTDB; las reglas actuales no se cambiaron.
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
