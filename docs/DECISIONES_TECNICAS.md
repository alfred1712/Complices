# Decisiones técnicas y de producto

Actualizado: 31 de octubre de 2026. Registro compacto de decisiones inferidas o verificadas en el código y documentación. No equivale a acuerdos legales o comerciales.

| Decisión | Motivo conocido / estado | Consecuencia |
|---|---|---|
| La marca visible es Cómplices. | Decisión explícita del usuario en conversaciones previas. | No renombrar IDs internos solo por el cambio de marca. |
| Mantener Firebase project `juego-cruzado`, sus endpoints y Android `com.chispa.app`. | Compatibilidad con salas, Authentication, Hosting y APK instalada; cambio requiere migración. | Backend y package se conservan. |
| La app web y la APK comparten interfaz HTML. | La APK carga la copia del HTML desde Android assets; web publica `web/`. | Un cambio UI debe sincronizar las tres copias. |
| `index5-final-v4.html` es la fuente canónica. | Convención permanente en `AGENTS.md`. | Editar esa fuente y sincronizar Hosting/assets. |
| RTDB compartida, Auth anónima. | Arquitectura activa verificada. | Las salas dependen del código compartido y de reglas del backend. No hay usuarios/cuentas tradicionales. |
| No hay chat ni transferencia de multimedia en Cómplices. | Decisión expresa del usuario; multimedia se envía por un canal privado elegido por el grupo. | No agregar funciones de transferencia de contenido sin instrucción nueva. |
| Pareja admite hasta dos participantes conectados; con más, la sala funciona como Grupo. | Implementación de 1.20 documentada y contenida en el código activo. | Los clientes conectados comparten modo y estado. |
| Turno de ruleta expira a los 30 s; carta puede ser tomada por otra persona. | Implementación 1.20 en el cliente y transacciones RTDB. | Probar transferencias/tiempos con varios clientes y sala desechable. |
| Comodines son recursos iniciales por jugador, no cartas del mazo. | Decisión de producto anterior e implementación actual. | Sus transacciones deben verificar saldo y carta activa. |
| Reiniciar Android inicia una sala vacía; un enlace con `?sala=` une a la sala. | Comportamiento preparado desde 1.18; el nombre/preferencias quedan locales. | No tratar el reinicio como borrado de datos remotos.
| Sonido ambiente eliminado; SFX son opcionales. | La melodía ambiental se consideró repetitiva y molesta. | No reintroducir música por defecto.
| `allowBackup=false`, tráfico cleartext prohibido. | Endurecimiento Android 1.21 instalado en dos Motorola; cleartext ya estaba prohibido. | El build y smoke test no reemplazan una auditoría de seguridad del WebView.
| JavaScript y acceso al asset local siguen habilitados en WebView; no se usa bridge JavaScript. | Firebase y la UI dependen del HTML local; no hay `addJavascriptInterface`. | No desactivar `setAllowFileAccess` sin migrar el origen de assets y probar Firebase.
| Reglas RTDB no se endurecen sin emulator/matriz de compatibilidad. | Las reglas activas permiten escritura amplia de `gameData`; las propuestas v2 no coinciden con el cliente. | El riesgo se documenta; no desplegar reglas propuestas directamente.
| El sitio `complices-en-juego` es el único Hosting de aplicación; el antiguo se deja como redirección. | El sitio predeterminado no puede borrarse por la API Firebase, según registro previo. | Publicar solo `hosting:complices`; el target legado se trata por separado.
| APK actual para probar es debug, sin firma de distribución. | No se configuró keystore release. | No subir APK/keystore/secretos a Git.
| Publicaciones remotas respetan el alcance de la autorización vigente. | El usuario autorizó despliegue de la app web, commit y push a `main`; reglas y recursos Firebase ajenos a Hosting siguen fuera de alcance. | Desplegar solo `hosting:complices`; reportar commits/pushes verificados y proteger archivos locales ajenos al release.

## Decisiones pendientes

- Nivel de protección de sala (código compartido, mediación o cuentas).
- Política y mecanismo para expiración/borrado de datos de juego.
- Si se usará `FLAG_SECURE`, dado que reduce posibilidad de capturar pantalla.
- Verificación de edad adecuada al lanzamiento/mercado; la puerta actual es declarativa.
- Alcance de CSP, App Check y restricciones de API key tras pruebas de compatibilidad.
- Si y cuándo iniciar arquitectura premium, pagos, consola de administración o migración de backend.
