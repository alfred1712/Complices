# Estado actual de Cómplices

Fecha: 30 de octubre de 2026. Esta nota registra cambios y verificaciones realizados en el checkout local; no sustituye la comprobación de la versión remota.

## Estado verificado

- Rama `main`, release `v1.15` en commit `b76e3b8`; publicada en `origin/main` junto con el tag anotado `v1.15`. La actualización de esta nota de continuidad se registra inmediatamente después de ese release.
- Hosting nuevo: `complices-en-juego.web.app`. Firebase CLI confirmó la publicación del 30/10. El usuario comprobó desde un navegador externo que los sitios responden.
- Firebase informa que `juego-cruzado` es el sitio Hosting predeterminado y rechaza su eliminación (HTTP 400: `Cannot delete default Hosting Site`). Se desplegó en su lugar la redirección a Cómplices, que conserva query/hash de sala cuando JavaScript está disponible y ya no sirve el juego.
- APK de depuración 1.15 (`versionCode 16`) compilada con Gradle 9.7.1, Android Studio JBR 25 y AGP 9.3.2. Resultado: `BUILD SUCCESSFUL`; salida en `android-app/app/build/outputs/apk/debug/app-debug.apk`.
- La compilación usa `compileSdk 37`, `minSdk 23`, `targetSdk 35`. El APK está copiado como `Complices-1.15-debug.apk` en la raíz (ignorado por Git). No se ejecutaron pruebas unitarias/instrumentadas ni pruebas en uno o dos dispositivos en esta tarea.
- No se consultaron ni modificaron reglas remotas de Realtime Database.

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

Revisar la redirección con una sala válida en navegador y probar el APK en los dispositivos cuando estén conectados. Mantener fuera de Git todo archivo ignorado o secreto y no desplegar reglas de base de datos.
