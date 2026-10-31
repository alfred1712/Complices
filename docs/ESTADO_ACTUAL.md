# Estado actual de Cómplices

Fecha: 30 de octubre de 2026. Esta nota registra cambios y verificaciones realizados en el checkout local; no sustituye la comprobación de la versión remota.

## Estado verificado

- Rama `main`, release `v1.15` en commit `b76e3b8`; publicada en `origin/main` junto con el tag anotado `v1.15`. La actualización de esta nota de continuidad se registra inmediatamente después de ese release.
- Hosting nuevo: `complices-en-juego.web.app`. Firebase CLI confirmó la publicación del 30/10. El usuario comprobó desde un navegador externo que los sitios responden.
- Firebase informa que `juego-cruzado` es el sitio Hosting predeterminado y rechaza su eliminación (HTTP 400: `Cannot delete default Hosting Site`). Se desplegó en su lugar la redirección a Cómplices, que conserva query/hash de sala cuando JavaScript está disponible y ya no sirve el juego.
- APK de depuración 1.15 (`versionCode 16`) compilada con Gradle 9.7.1, Android Studio JBR 25 y AGP 9.3.2. Resultado: `BUILD SUCCESSFUL`; salida en `android-app/app/build/outputs/apk/debug/app-debug.apk`.
- La compilación usa `compileSdk 37`, `minSdk 23`, `targetSdk 35`. El APK está copiado como `Complices-1.15-debug.apk` en la raíz (ignorado por Git). No se ejecutaron pruebas unitarias/instrumentadas ni pruebas en uno o dos dispositivos en esta tarea.
- Reglas RTDB consultadas en modo de solo lectura: los miembros autenticados pueden leer/escribir `gameData` completo, sin validación por campo; presencia está limitada a su propio UID con validación básica. No se modificaron reglas.

## Cambios locales posteriores a 1.15

- Se implementó una primera versión de A–D descrita en `docs/ROADMAP_FUNCIONALIDADES.md`: giro 3D compartido, temporizador sincronizado con duración inferida del texto, SFX y ambiente sintetizados, hasta 12 cartas propias anónimas por sala, cierre y reporte de imagen sin datos identificatorios.
- El HTML canónico está sincronizado byte a byte con Hosting `web/` y el asset de Android. SHA-256 verificado en esta sesión.
- Firebase CLI confirmó el deploy selectivo de `hosting:complices`; verificación HTTP del dominio nuevo: 200 e incluye los elementos HTML/CSS de A–D.
- Se actualizó Android a 1.16 (`versionCode 17`). `assembleDebug` terminó correctamente con Gradle 9.7.1 y Android Studio JBR. APK: `Complices-1.16-debug.apk` en raíz, ignorada por Git.
- Se comprobó la sintaxis del JavaScript en línea (`node --check`) y `git diff --check`. No se completaron pruebas interactivas: el navegador muestra la puerta de edad y no la envié; ADB no mostró dispositivos. No se probó la sala entre dispositivos.
- Las cartas propias y el timer se almacenan en el `gameData` compartido, sin autor visible; los integrantes pueden leer el texto. No hay validación/moderación del servidor. Las reglas desplegadas permiten los campos, pero también permiten que cualquier miembro sobrescriba el juego completo.
- Los cambios de código y documentación están locales, sin commit ni push. El remoto sigue en la release 1.15.

## Ajustes de usabilidad en curso — 1.17

- Se añadieron controles separados de volumen para ambiente y SFX, persistidos en el almacenamiento local del dispositivo. El control ajusta la salida de la app; el volumen general continúa dependiendo de los botones del teléfono/sistema operativo.
- Se aumentó el tamaño base y el de textos pequeños en web y WebView. Se reforzó la animación de revelado a 1,65 s con una carta posterior mayor, marco y destello.
- La revisión detectó que los retos personalizados ya se escribían en RTDB y se mezclaban en `availableCards`, pero el catálogo «Ver todas las cartas» solo renderizaba el mazo base. Ahora toma también las cartas propias de la sala y se vuelve a pintar al recibir actualizaciones Firebase.
- Android quedó configurado como 1.17 (`versionCode 18`). `assembleDebug` terminó correctamente; APK en `Complices-1.17-debug.apk` (926652 bytes, ignorada por Git). `aapt` confirmó paquete `com.chispa.app`, versionCode 18 y versionName 1.17.
- El deploy selectivo `hosting:complices` terminó correctamente; `https://complices-en-juego.web.app/` respondió HTTP 200 y contiene los sliders, la animación extendida y el catálogo actualizado.
- Se instaló 1.17 en el Motorola Edge 40 Pro conectado por ADB y `dumpsys` confirmó versionCode 18. La app abrió y no aparecieron errores fatales en los logs iniciales; no se probaron interacciones después de la pantalla de acceso adulto. No había un segundo dispositivo conectado, así que no se confirma la instalación ni la prueba multi-dispositivo.
- `node --check` del JavaScript inline, `git diff --check` y comparación SHA-256 de las tres copias HTML finalizaron sin errores.

## Correcciones de sesión y presentación — 1.18

- Se eliminó el generador de ambiente musical; el cliente queda en silencio salvo SFX activados por el usuario.
- El giro se rehízo con caras frontal y posterior en un contenedor 3D con perspectiva y acabado foil, mostrando nivel y título del reto.
- Android ya no recrea la Activity/WebView por cambios de orientación (`configChanges` y `onConfigurationChanged`).
- Nueva sesión limpia por apertura: Android lanza el HTML con `nueva=1`; la web crea una sala por primera visita de la pestaña. No se borra la sala anterior; un enlace `?sala=` continúa uniendo a la sala compartida. El nombre y preferencias locales permanecen.
- Versión 1.18 (`versionCode 19`) compilada y verificada como `Complices-1.18-debug.apk` (926799 bytes). Deploy selectivo de Hosting completado; el sitio respondió HTTP 200 e incluye modo silencioso, las dos caras 3D y la lógica de sala nueva.
- En el Motorola Edge 40 Pro (ADB), confirmé 1.18 instalada; al abrir creó una sala vacía y conservó el nombre local. Giré una carta, vi la cara frontal 3D revelar el título, inicié y pausé el temporizador y marqué una carta de prueba como omitida. También roté con una carta activa: la pantalla pasó a `ROTATION_90`, conservó el mismo PID y token de Activity y regresó a `ROTATION_0`; restauré `accelerometer_rotation=1` y `user_rotation=0`.
- La revisión final no encontró `FATAL EXCEPTION`, `AndroidRuntime`, `Uncaught TypeError` ni `ReferenceError` en los logs consultados. Dejé la app apuntando a una nueva sala vacía, manteniendo el nombre. Las salas desechables usadas para probar no se borraron.
- `node --check`, `git diff --check` y sincronización SHA-256 de las tres copias HTML finalizaron correctamente. La UI mostró SFX silenciados y el cliente ya no contiene generador ni control de ambiente musical.

## Límite de modalidad por participantes

- Pareja queda disponible con hasta dos participantes conectados. Cuando hay tres o más, la sala pasa a Grupo en todos los clientes y el selector deshabilita Pareja. El cambio preserva historial y carta activa; las cartas pendientes se reconstruyen para Grupo, excluyendo las que ya se jugaron.
- Esta regla está preparada en el HTML canónico, Hosting y assets Android; requiere compilar y publicar la versión que la contiene para que llegue a los usuarios. Se documentó la prueba de dos participantes y el ingreso/salida de un tercero en `MVP-OPERATIONS.md`.

## Turnos, comodines y toma del reto — 1.20 (web publicada)

- El HTML canónico y las copias de Hosting/Android contienen el selector de turno sincronizado de 30 segundos. Solo el UID con el turno puede girar; finalizar, omitir y vencer el tiempo hacen avanzar al próximo participante. El sorteo vuelve a comprobar el turno dentro de la transacción compartida.
- La carta activa ofrece **Robar este reto** a otros participantes conectados. Robarla cambia de forma atómica el titular de la carta y el turno a quien la tomó, y reinicia su contador. El titular nuevo es el único que puede finalizar u omitirla.
- Un participante sin turno puede usar su propio comodín en una carta activa de Nivel 2 o 3. La transacción comprueba saldo y carta, registra el uso, retira esa carta y avanza el turno del titular anterior. No permite usarlo sin carta, en Nivel 1 ni dos veces sobre el mismo reto ya retirado. El máximo se mantiene en dos por participante y partida.
- `Complices-1.20-debug.apk` (`versionCode 21`) se compiló y en esta sesión se instaló correctamente en Motorola Edge 40 Pro y Edge 40 Neo. `dumpsys package` confirmó `versionCode=21`, `versionName=1.20` en ambos; Cómplices abrió como `MainActivity` en los dos. El chequeo breve de logcat no mostró `FATAL EXCEPTION`, `AndroidRuntime`, `Uncaught TypeError` ni `ReferenceError`. ADB primero falló al iniciar, pero `start-server` fuera del sandbox lo recuperó. Esta comprobación confirma instalación y arranque, no el flujo interactivo de robar un reto.
- Firebase CLI 15.34.2 quedó operativa mediante el ejecutable oficial para Windows; el acceso al proyecto `juego-cruzado` se validó tras autorización OAuth de la cuenta. El intento previo con el lanzador `instant` dejó incompleta la caché y mostró el error `@pnpm/npm-conf` faltante; se respaldó esa caché con nombre `tools-incomplete-backup-20261030` y el CLI estándar reconstruyó una instalación funcional. Se instaló una copia estable bajo `%LOCALAPPDATA%\Programs\FirebaseCLI`, se agregó al PATH del usuario y se verificó `firebase --version` y `firebase projects:list`.
- El 30/10/2026 a las 20:16 (-03) se ejecutó `firebase deploy --only hosting:complices --project juego-cruzado --non-interactive`. Firebase confirmó `hosting[complices-en-juego]` y release completa. No se desplegaron reglas, Functions ni el target `legacy-redirect`.
- Se recargó `https://complices-en-juego.web.app/` y se verificó `#stealCardBtn` en el DOM y visible en pantalla mientras había una carta activa asignada a otra persona. El titular actual ve sus controles de finalizar/omitir; el botón de robo aparece para quien no tiene esa carta. No se pulsó el botón para evitar alterar el estado de una sala cuya condición de prueba no estaba confirmada; la interacción de transferencia entre dos clientes sigue pendiente.
- Próxima validación necesaria: usar una sala descartable con tres clientes. Probar robo desde un no titular y que el nuevo titular finalice; probar comodín de un participante sin turno en Nivel 2/3 y verificar que el contador baje en uno. No usar la sala real para estas pruebas.

## Trabajo preparado

- Actualización de versión Android de 1.14/15 a 1.15/16.
- Instrucciones permanentes para agentes en `AGENTS.md`, inicio rápido en `README.md` y este estado de continuidad.
- El target de Hosting principal sigue siendo `complices`; la redirección del Hosting predeterminado está separada como `legacy-redirect`.
- Los cambios deben preservarse. No se deben restaurar las eliminaciones históricas ni descartar los cambios locales antes de revisar `git status`.

## Pendientes y límites

- No es posible borrar el sitio Hosting predeterminado mediante Firebase API. El sitio ahora redirige; verificación HTTP: ambos sitios respondieron 200, el legado devuelve el mensaje de mudanza y no el juego; el sitio nuevo sirve el título de Cómplices.
- La preservación de `?sala=` está implementada en la redirección JavaScript; falta prueba en navegador con una sala válida. Verificar el inicio anónimo con el dominio nuevo si no se ha hecho tras publicar.
- Instalar el APK en los teléfonos requiere dispositivos ADB conectados; la compilación por sí sola no confirma instalación.
- No hay firma release configurada. La APK generada es de depuración y no equivale a una release firmada para distribución pública.

## Siguiente paso sugerido

Probar A–D con una sala descartable y dos dispositivos en la misma versión, revisar duración de cartas repetidas y validar la imagen compartida en WebView. Mantener fuera de Git todo archivo ignorado o secreto y no desplegar reglas de base de datos.
