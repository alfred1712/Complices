# Cómplices — transferencia y continuidad

Actualizado: 31 de octubre de 2026. Preparado para que el siguiente agente continúe desde el checkout real, sin tratar esta nota como autorización para publicar o descartar trabajo.

## Objetivo y arquitectura activa

- Cómplices es un juego social para personas adultas, disponible como web y APK Android.
- `index5-final-v4.html` es la fuente canónica; `web/index.html` y `android-app/app/src/main/assets/index.html` deben permanecer idénticos en contenido.
- Android aloja el HTML en un WebView local. Identificadores internos vigentes: Firebase project `juego-cruzado`, paquete Android `com.chispa.app`; no cambiarlos sin plan explícito de migración.
- Las salas y el estado compartido usan Firebase Authentication anónima y Realtime Database. El sitio de aplicación es `complices-en-juego`; `juego-cruzado.web.app` se conserva como redirección legado.
- Firebase rules permiten a cada miembro autenticado escribir todo `gameData`. No endurecerlas sin modelar todas las escrituras y probar reglas con Emulator Suite. No usar datos/entitlements de pago en el estado actual.

## Estado Git y preservación

- Checkout: `C:\Users\alfre\Downloads\jueguito`, rama `main`, HEAD `141b7a4` (`Release Complices 1.20`), igual que `origin/main` al inicio de esta revisión.
- El checkout está deliberadamente sucio. Ya contenía cambios locales de preparación 1.21 y documentación antes de las pruebas de esta ronda. Preservar el diff, no ejecutar `reset`, `clean`, `checkout --`, `restore` ni eliminar capturas/logs.
- Archivos modificados previamente: `.gitignore`, `AGENTS.md`, `MVP-OPERATIONS.md`, `README.md`, `android-app/app/build.gradle`, `android-app/app/src/main/AndroidManifest.xml`, `android-app/app/src/main/assets/index.html`, `android-app/app/src/main/java/com/chispa/app/MainActivity.java`, `docs/ESTADO_ACTUAL.md`, `index5-final-v4.html`, `web/index.html`.
- Documentos locales existentes: `docs/ARQUITECTURA.md`, `docs/DECISIONES_TECNICAS.md`, `docs/PLAN_DESARROLLO.md`; esta ronda añade `docs/HISTORIAL_CAMBIOS.md` y este documento.
- También hay capturas históricas y `firepit-log.txt` sin rastrear. Dejarlas intactas y no subir registros, datos de prueba, APKs ni secretos.

## Implementado localmente y verificado por código/build

- Versión Android local 1.21 (`versionCode 22`, `minSdk 23`, `targetSdk 35`), Gradle 9.7.1, JBR 25, AGP 9.3.2. Build debug previo: `BUILD SUCCESSFUL`; APK local `android-app/app/build/outputs/apk/debug/app-debug.apk` (932823 bytes al 31/10/2026). La app no tiene release firmada configurada.
- Código 1.21 escapa datos de presencia/cartas/historial antes de pintarlos y restringe IDs SVG decorativos. MainActivity conserva acceso al asset local y cierra rutas a otros orígenes/`content://`, navegación fuera de assets y tráfico mixto. El manifest mantiene `allowBackup=false`.
- Turno de 30 s, robo de reto y comodines aparecen implementados en el código 1.20/1.21. `Robar este reto` debe conservarse: el render lo oculta al titular (`drawnByUid`) y a clientes sin nombre local; los demás jugadores nombrados lo ven. Asegurar esta condición en cambios posteriores.

## Pruebas verificadas en esta ronda

- APK 1.21 instalada en Motorola Edge 40 Pro (`adb-ZY22HB4TNN-yVAqUi._adb-tls-connect._tcp`) y Edge 40 Neo (`adb-ZY22HT6MSH-BCjREV._adb-tls-connect._tcp`). `dumpsys package` confirmó `versionName=1.21`, `versionCode=22`, `minSdk=23`, `targetSdk=35` en ambos.
- Ambos abrieron, se unieron a una sala desechable creada para la prueba y mostraron a QA-Pro/QA-Neo en línea, modo Pareja y turnos compartidos. El test no completó el sorteo: el turno rotó mientras se interactuaba y no se confirmó carta activa en ambas pantallas. No declarar aprobados los flujos que dependen de una carta.
- El filtro en 3000 líneas recientes de logcat del Pro no encontró `FATAL EXCEPTION`, `AndroidRuntime`, `Uncaught TypeError`, `ReferenceError` ni `FirebaseError`. Es solo inspección puntual.
- No hubo tercer participante web. El intento de interacción de navegador quedó bloqueado antes de obtener un contexto comprobable. APK–APK–Web permanece pendiente.
- Se dejó intacta una sala preexistente de identidad desconocida; las pruebas autorizadas posteriores usaron una sala nueva desechable. No borrar la sala de prueba ni la anterior automáticamente.
- No se desplegó Hosting ni reglas y no se hizo commit/push.

## Siguientes pasos sugeridos

1. Leer `AGENTS.md`, `README.md`, `docs/ESTADO_ACTUAL.md`, `MVP-OPERATIONS.md` y verificar `git status --short --branch`, diff y hash de las tres copias antes de tocar nada.
2. Repetir pruebas de turno y ruleta en la sala desechable, con una captura/observación simultánea de ambos móviles. Validar carta e identidad del titular iguales en ambos clientes.
3. Con carta activa, verificar que el titular no ve «Robar este reto» y que el otro jugador sí; ejecutar el robo desde el segundo y probar que solo el nuevo titular finaliza u omite. No eliminar el botón.
4. Probar comodines sin carta, con carta válida de nivel 2/3, intento repetido y turno ajeno; comprobar saldo e historial.
5. Si se conecta un tercero web, probar presencia, cambio automático a Grupo y propagación del mismo estado entre APK–APK–Web. No reabrir browser automations si la herramienta no puede validar el contexto.
6. Correr las validaciones estáticas y `assembleDebug` solo si hubo cambios; documentar sus resultados. No publicar, cambiar reglas, crear commits o pushes sin autorización expresa.

## Restricciones de continuidad

- No alterar reglas remotas de Realtime Database, Firebase Hosting ni el target legado fuera del alcance autorizado.
- No desplegar si la tarea actual no da permiso explícito; si se autoriza, desplegar solo `firebase deploy --only hosting:complices --project juego-cruzado`.
- No actualizar dependencias, identificadores o endpoints sin necesidad y plan aprobado.
- No afirmar que build equivale a test en teléfono ni que la instalación demuestra un flujo completo.

## Continuidad posterior a las pruebas — 31/10/2026

Esta sección supersede las notas anteriores de esta transferencia que decían que no había carta compartida ni acción de robo confirmada. Las pruebas actuales confirmaron la carta 018 sincronizada, el robo de reto desde el Neo, cambio de titular/turno visible en ambos y avance al finalizar. El comodín sin carta permaneció deshabilitado. No se verificó un comodín válido de Nivel 2/3 ni un tercer cliente web.

`assembleDebug` terminó correctamente y la APK 1.21 (versionCode 22) se reinstaló y verificó en ambos Motorola. Firebase CLI publicó exclusivamente `hosting:complices`; `https://complices-en-juego.web.app/` respondió HTTP 200 con el contenido actualizado. No cambiar reglas ni tocar salas remotas. Estado de commit/push se informa al cierre de esta sesión.
