# Instrucciones para agentes de Cómplices

Cómplices es un juego web para adultos con APK Android basado en WebView. El objetivo es mantener un MVP funcional, sincronizado entre navegador y APK, y documentar toda modificación relevante. `index5-final-v4.html` es la fuente canónica.

## Antes de trabajar

- Lee este archivo, `README.md`, `docs/ESTADO_ACTUAL.md` y la guía relacionada con la tarea.
- Comprueba `git status --short --branch`, la rama y los últimos commits. Preserva todo cambio previo; no limpies, restaures, borres ni sobrescribas trabajo sin autorización explícita.
- Contrasta la documentación con el código. Distingue hechos verificados, contexto histórico e hipótesis.
- El HTML activo es `index5-final-v4.html`. Después de editarlo, sincroniza `web/index.html` y `android-app/app/src/main/assets/index.html`, y compara sus hashes.

## Alcance y seguridad

- No cambies el proyecto Firebase `juego-cruzado`, sus endpoints ni `applicationId`/namespace Android `com.chispa.app` sin una decisión explícita y un plan de migración.
- No despliegues reglas de Realtime Database, Firestore o Functions como parte de un deploy de Hosting. Revisa el alcance del comando antes de ejecutarlo.
- `complices-en-juego` es el único sitio que aloja la aplicación. `juego-cruzado` es el sitio Hosting predeterminado de Firebase y no se puede borrar por API; se conserva solo como redirección a Cómplices. No vuelvas a publicar la aplicación allí.
- No subas APKs, keystores, tokens, credenciales ni datos privados a Git. El cliente activo usa el backend Firebase de producción; las pruebas que escriben estado requieren una sala desechable.
- No agregues dependencias ni actualices versiones sin necesidad y autorización adecuada. No afirmes pruebas, instalaciones o despliegues que no hayas verificado.

## Validación y entrega entre agentes

- Usa las validaciones proporcionales a la tarea: `git diff --check`, JSON válido, hashes iguales del HTML y `assembleDebug` cuando el entorno lo permita.
- En cambios de Android, documenta SDK, Gradle/JDK, variante, resultado y ubicación del APK. La compilación no confirma el comportamiento en un dispositivo.
- En cambios web, despliega únicamente con `firebase deploy --only hosting:complices --project juego-cruzado`; el target `legacy-redirect` solo sirve para actualizar la página de redirección solicitada.
- Al terminar, actualiza `docs/ESTADO_ACTUAL.md` y deja un resumen que incluya objetivo, estado inicial, archivos, cambios, validaciones y resultados, limitaciones, pendientes, recomendación siguiente y estado de Git.
- No hagas commit, tag, push, publicación externa ni acción remota destructiva salvo que el usuario lo solicite expresamente.
- No despliegues Hosting sin autorización expresa en la tarea actual. Si está autorizado, usa solo el target indicado arriba y registra resultado verificable.
- Al recibir una transferencia, contrasta primero este archivo, `README.md`, `docs/ESTADO_ACTUAL.md`, el resto de continuidad, Git y el código real. Informa diferencias antes de ampliar o reescribir arquitectura.
- Para entregar a otro agente, actualiza `docs/ESTADO_ACTUAL.md` y el documento principal `docs/TRANSFERENCIA_AGENTE_C.md`; distingue implementación, validación, publicación y supuestos. Conserva historial útil y trabajo local sin confirmar.
