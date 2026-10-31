# Cómplices — operación del MVP

Estado revisado: 30 de octubre de 2026. El commit `141b7a4` contiene la versión 1.20 desplegada; el checkout local ahora prepara la 1.21 con mitigaciones XSS y endurecimiento del WebView. Hosting sigue en 1.20 hasta un deploy autorizado. No constituye autorización para desplegar reglas de base de datos.

## Código activo y nombres

- El HTML canónico de trabajo es [`index5-final-v4.html`](index5-final-v4.html). Las copias que deben coincidir byte a byte son [`web/index.html`](web/index.html) (Firebase Hosting) y [`android-app/app/src/main/assets/index.html`](android-app/app/src/main/assets/index.html) (APK). Tras editar el canónico, copiarlo a ambas rutas y comparar SHA-256 antes de compilar/publicar.
- La web y Android son la misma interfaz: el APK es un WebView que abre `file:///android_asset/index.html`. El comportamiento multi-dispositivo se conecta al backend Firebase definido dentro del HTML.
- La marca visible es **Cómplices**. Se conservan por compatibilidad el proyecto Firebase `juego-cruzado`, sus URLs de backend y el `applicationId`/namespace `com.chispa.app`. Las claves locales antiguas se migran una vez a nombres Cómplices para conservar preferencias y datos del dispositivo. Cambiar el project ID requiere migrar el backend; cambiar `applicationId` haría que Android trate la APK como una aplicación distinta.
- `complices-en-juego.web.app` es el único sitio que sirve la app. Firebase no permite borrar el sitio Hosting predeterminado `juego-cruzado.web.app`; el target `legacy-redirect` sirve allí solo una página de redirección y no debe volver a alojar la app.
- Las copias del HTML se mantienen sincronizadas manualmente; no había un verificador automatizado de paridad en el checkout inicial.

## Arquitectura activa

- Cliente: HTML, CSS y JavaScript en un único archivo; Firebase JavaScript SDK compat; Firebase Authentication anónima y Realtime Database.
- Datos sincronizados: código de sala, miembros anónimos, nombres visibles, modo, nivel de intensidad, mazo disponible, carta activa, historial, comodines y presencia. La app no ofrece chat ni transferencia de contenido multimedia.
- La confirmación de edad actual es una declaración del cliente almacenada en `sessionStorage`; no es una validación de edad en el servidor.
- Los nombres de presencia, cartas propias y textos del historial proceden del estado compartido de la sala. La versión local 1.21 los escapa al construir fragmentos HTML y limita las ilustraciones SVG a identificadores de mazo conocidos.
- El contenido de cartas está versionado dentro del HTML. La exportación vigente se conserva en [`cartas-complices.md`](cartas-complices.md) y [`cartas-complices.csv`](cartas-complices.csv).

## Realtime Database: rutas y reglas

El cliente usa estas rutas bajo `salas/{codigo}`:

| Ruta | Operaciones del cliente |
| --- | --- |
| `miembros/{uid}` | Escribe `true` al entrar; retira su propio miembro si un enlace explícito no corresponde a una sala encontrada. |
| `gameData` | Lectura inicial y suscripción en vivo; transacciones para migrar estado, reconciliar mazo, elegir carta, cambiar intensidad, guardar acciones y comodines; reemplazo completo al crear o reiniciar una partida. |
| `mazos/{mazo}/gameData` | Lectura de estado antiguo para migrarlo a `gameData`. |
| `presences` y `presences/{uid}` | Lee presencia de sala; escribe nombre y timestamp en su nodo; registra `onDisconnect().remove()`. |
| `.info/connected` | Lee el estado de conexión del SDK. |

### Estado local de las reglas

[`database.rules.fragment.json`](database.rules.fragment.json) es un fragmento de reglas, no un archivo listo para Firebase CLI: no tiene la envoltura `{"rules": ...}`, no impone validaciones campo por campo para `gameData` y no está enlazado desde el `firebase.json` raíz. `firebase.json` solo configura Hosting; por ello los deploys documentados aquí no deben incluir `database`.

Si ese fragmento reflejara las reglas activas, cada UID anónimo que figure en `miembros` podría escribir el `gameData` completo. Eso incluye cambiar/eliminar cartas disponibles, alterar modo e intensidad, inventar o borrar historial, modificar `scores`/`wildcardUsage` de cualquier nombre y sustituir la carta activa. La regla de presencia limita la escritura al UID propio y exige `name` string y `ts` número, pero no impone límites de longitud ni prohíbe campos extra. El fragmento local por sí solo no demuestra el despliegue.

**Reglas activas verificadas el 30/10/2026 (solo lectura):** `firebase database:get /.settings/rules --project juego-cruzado` confirmó que las reglas desplegadas sí permiten a todo UID autenticado listado en `miembros/{uid}` leer y escribir el `gameData` completo, sin validación por campo. Presencias solo permiten la escritura del UID propio y validan `name` (string) y `ts` (number). No se modificaron las reglas. Esto permite los campos de temporizador y cartas propias añadidos por la versión 1.16, pero también significa que cualquier miembro puede reescribir todo el estado compartido; no usar entitlements ni pagos basados en este permiso amplio.

### Cómo consultar las reglas activas sin cambiarlas

1. En Firebase Console, abrir el proyecto `juego-cruzado`, entrar a Realtime Database y abrir **Rules**. La consola muestra la versión desplegada más reciente.
2. Para una copia automatizable, la API REST de gestión admite `GET` a `https://juego-cruzado-default-rtdb.firebaseio.com/.settings/rules.json` autenticado con un OAuth access token. Mantener el token fuera de comandos registrados, archivos, URLs compartidas y Git. Usar exclusivamente `GET`; `PUT` reemplaza las reglas.
3. Guardar la respuesta en un archivo temporal local, comparar el objeto `rules` completo y revisar las diferencias antes de elegir una fuente canónica. No comparar el fragmento actual como si fuera un ruleset completo.
4. Antes de cualquier futura modificación, probar las reglas copiadas con Emulator Suite y una matriz de dos usuarios anónimos (miembro/no miembro) para entrada, lectura, presencia, cada transacción y denegaciones. No desplegar durante la auditoría.

La propuesta de `v2` exigía el claim `adultConfirmed`, pero el cliente activo solo llama a `signInAnonymously()` y no obtiene ese claim. No desplegar esas reglas: bloquearían flujos del cliente y no implementan una verificación de edad compatible.

Referencias oficiales: [reglas de Realtime Database](https://firebase.google.com/docs/database/security), [lectura de reglas por REST](https://firebase.google.com/docs/database/rest/app-management?hl=en), [pruebas locales de reglas](https://firebase.google.com/docs/database/security/get-started).

## Firebase Hosting

El deploy debe seleccionar un target; no usar `--site` (esa opción produjo `unknown option '--site'`). El target `complices` publica `web/` en `complices-en-juego`; `legacy-redirect` publica únicamente la página de retiro en el sitio Hosting predeterminado.

Comandos desde la raíz, una vez configurado el target local:

```powershell
firebase login
firebase target:apply hosting complices complices-en-juego --project juego-cruzado
firebase emulators:start --only hosting:complices --project juego-cruzado
firebase deploy --only hosting:complices --project juego-cruzado
firebase deploy --only hosting:legacy-redirect --project juego-cruzado
```

`firebase target:apply` guarda el target en `.firebaserc`; debe ejecutarse una sola vez por checkout. `firebase deploy --only hosting:complices` publica únicamente la app. El target `legacy-redirect` se despliega por separado cuando cambia su página. No ejecutar `firebase deploy --only hosting` si se pretende limitar el deploy al nuevo target. Antes de publicar, comprobar que `complices-en-juego.web.app` figure entre los dominios autorizados de Firebase Authentication para el inicio anónimo. Estos deploys no cambian reglas de Realtime Database.

`publish-web.ps1` es el atajo para el mismo deploy selectivo; requiere Firebase CLI instalado y autenticado. No almacena tokens. La publicación anterior al sitio antiguo se conserva en `hosting-deploy-result.txt` como registro histórico.

Firebase recomienda targets para proyectos con varios sitios: [Firebase Hosting multisite](https://firebase.google.com/docs/hosting/multisites).

En este equipo, Firebase CLI 15.34.2 se recuperó el 30/10/2026 usando la distribución independiente oficial de Windows. El lanzador `instant` falló al validar credenciales y dejó una caché incompleta; se conservó esa caché como respaldo, se reconstruyó desde el binario normal y se instaló un `firebase.cmd` per-user en el PATH. `firebase projects:list` confirmó acceso a `juego-cruzado`; no guardar ni versionar tokens ni archivos de sesión.

## Compilar e instalar Android

Configuración activa en `android-app/app/build.gradle`: AGP 9.3.2, compile SDK 37, min SDK 23, target SDK 35, `applicationId com.chispa.app`. Versión local 1.21 (`versionCode 22`) compilada correctamente con Gradle 9.7.1 y Android Studio JBR 25: `BUILD SUCCESSFUL`. La APK queda en `android-app/app/build/outputs/apk/debug/app-debug.apk`; no versionar APKs. Un checkout limpio necesita Android Studio/SDK configurados y una instalación compatible de Gradle.

### Nota de endurecimiento 1.21

- `MainActivity` conserva `setAllowFileAccess(true)` porque la interfaz corre desde `file:///android_asset/index.html`; deshabilita acceso desde archivos a otros orígenes, acceso a `content://`, y bloquea navegación principal fuera del directorio de assets. No registra `addJavascriptInterface`; el tráfico mixto permanece prohibido.
- El manifest declara `allowBackup="false"`; `usesCleartextTraffic="false"` y `exported` explícito ya estaban configurados.
- La mitigación XSS escapa texto dinámico de presencia, mazo, comodines e historial antes de interpolarlo en los templates. El HTML dinámico restante se limita a contenido estático local/SVG con IDs de mazo permitidos.
- No se activó `FLAG_SECURE`: bloquearía capturas del dispositivo y afecta QA/uso del reporte. Es una decisión de privacidad/producto pendiente.

```powershell
gradle -p android-app assembleDebug
adb devices -l
adb -s <SERIAL> install -r android-app/app/build/outputs/apk/debug/app-debug.apk
adb -s <SERIAL> shell dumpsys package com.chispa.app | Select-String 'versionName=|versionCode='
```

Para una APK distribuible, generar una **release firmada** desde Android Studio (Build → Generate Signed Bundle / APK → APK). El proyecto no configura keystore ni firma release. Guardar la keystore y contraseñas fuera del repositorio; no distribuir una APK unsigned ni subir credenciales a Git.

## Pruebas y recuperación

- Ahora no hay pruebas unitarias/instrumentadas declaradas para el cliente activo. Una compilación correcta prueba empaquetado, no interacción ni backend.
- Comprobaciones automáticas disponibles sin añadir dependencias: validar JSON de Firebase, comprobar coincidencia SHA-256 de las tres copias HTML y compilar `assembleDebug`.
- Revisión técnica del 30/10/2026: discrepancia entre rama/producción descrita por el PDF ya no aplica al commit 1.20 que se desplegó y subió a `main`; el informe revisó solo parte del HTML y no inspeccionó Android nativo ni la lógica final de turnos. Se verificó XSS potencial en templates con nombres/cartas/historial y se mitigó en 1.21. Reglas amplias RTDB, ausencia de App Check, Tailwind CDN y ciclo de vida de salas continúan pendientes; no se modificaron reglas ni recursos remotos.
- En 1.17, comprobar con una sala descartable que las cartas propias aparecen en «Ver todas las cartas» y luego salen en el juego; ajustar por separado los sliders de ambiente y SFX; probar legibilidad móvil y observar la animación de revelado. Los sliders solo gobiernan el volumen producido por la app, mientras que Android/iOS conservan el control físico del volumen del dispositivo.
- A partir de 1.18, el ambiente musical no existe en el cliente (silencio por defecto; SFX siguen opcionales). Nueva apertura crea sala vacía sin borrar el estado antiguo; compartir/abrir un enlace `?sala=` conserva la sesión grupal. El 30/10/2026 se probó en Moto Edge 40 Pro: girar con una carta activa conservó PID y Activity, cambió a `ROTATION_90` y volvió a `ROTATION_0` con los ajustes originales restaurados.
- Smoke test de dispositivo único: abre, confirma mayoría de edad, inicia sesión, fija nombre, comprueba sala, mazos, ajustes, reglas, historial y reinicio solo en una sala de prueba.
- Prueba multi-dispositivo requiere dos Android conectados y autorizados en ADB: unir ambos a una sala desechable; confirmar presencia, aviso de carta, estado compartido, intensidad, finalización/omisión, comodines, desconexión y reconexión. La instalación 1.14 fue confirmada anteriormente en el Edge 40 Pro; la del Edge 40 Neo quedó sin confirmar. En la revisión del 30/10 ADB no mostró dispositivos.
- La modalidad Pareja admite hasta dos participantes conectados. Al superar ese número, el cliente deshabilita Pareja y cambia la modalidad compartida a Grupo; conserva el historial y la carta actual, y reconstruye el resto del mazo grupal excluyendo cartas ya jugadas. Validar con dos participantes (Pareja disponible), conectar un tercero (Grupo forzado en todos los clientes), y desconectarlo para comprobar que no se cambia automáticamente el modo ya elegido.
- En 1.20 el turno compartido dura 30 segundos. Solo la persona cuyo UID figura en `turnUid` puede girar; al finalizar, omitir o vencer el plazo, el turno avanza. La transacción de sorteo vuelve a validar el UID para descartar un giro atrasado.
- Mientras hay una carta activa, cada participante distinto de quien la tiene asignada ve **Robar este reto**. Al usarlo, una transacción confirma que `drawId` sigue siendo el mismo, asigna reto y turno al solicitante y reinicia su plazo de 30 segundos. Desde entonces el nuevo titular puede finalizar u omitir la carta; los demás no.
- Los comodines son independientes del turno activo: cualquier participante conectado puede gastar uno sobre una carta activa de Nivel 2 o 3. La transacción vuelve a validar carta y saldo, registra quién lo gastó, elimina el reto y avanza el turno del titular previo. El segundo toque rápido no debería gastar otro comodín porque ya no queda carta activa. No se aceptan comodines sin carta, en Nivel 1, ni con la partida cerrada; el límite sigue siendo dos por jugador y partida.
- Matriz manual multiusuario para 1.20: (a) titular gira y otro participante confirma que no puede girar en paralelo; (b) con reto Nivel 2/3 activo, participante sin turno usa comodín y saldo baja exactamente uno; repetir el toque sobre la misma carta no consume otro; (c) con reto activo, participante distinto usa **Robar este reto**, todos ven el nuevo titular y solo este puede finalizar/omitir; (d) validar que giro/robo simultáneos no alteren una carta distinta; (e) dejar vencer los 30 segundos y confirmar el siguiente turno en todos los clientes. El 30/10/2026 se publicó la copia sincronizada en `complices-en-juego`; al recargar la web se comprobó el botón visible durante una carta activa de otra persona. Su transferencia de estado aún necesita prueba interactiva en una sala descartable.
- No usar producción para probar reglas ni reinicios. El cliente tiene el endpoint Firebase de producción incrustado y el `firebase.json` raíz no configura emuladores de RTDB; una prueba local de Hosting por sí sola no aísla las escrituras del backend.
- Antes de cambios futuros: comprobar `git status`, conservar el diff, validar copias, compilar y usar una sala desechable. Para recuperar Hosting, usar el historial de releases del sitio afectado en Firebase Console; restaurar el APK anterior desde el respaldo de releases.

### Resultado de prueba de dos Androids — 31/10/2026

- APK local 1.21 / `versionCode 22` instalada en Edge 40 Pro y Edge 40 Neo; `dumpsys package` confirmó versión en ambos. El artefacto debug mide 932823 bytes en `android-app/app/build/outputs/apk/debug/app-debug.apk`.
- En una sala nueva desechable, ambos teléfonos aparecieron como QA-Pro y QA-Neo en línea. Los dos mostraron modo Pareja y el mismo selector de turno de 30 segundos.
- La prueba no consiguió fijar un instante con carta activa: el plazo rotó durante la interacción. No se consideran aprobados el sorteo, la carta compartida, el botón de robo, la resolución del turno ni los comodines. Repetir con más tiempo o con una sala aislada y capturas de ambos clientes tomadas inmediatamente.
- Lectura estática del cliente: el botón `stealCardBtn` se oculta al titular de la carta y cuando no hay nombre local; en los demás dispositivos queda disponible. La acción no fue ejecutada en esta prueba. Mantener esa opción; no sustituirla por una eliminación del control.
- No se encontró un error fatal ni una excepción JavaScript común en las últimas 3000 líneas consultadas de logcat del Edge 40 Pro. El Edge 40 Neo abrió y mostró la sala compartida, aunque el filtro de logcat se ejecutó en el Pro.
- Cliente web adicional no probado. Sin deploy, cambios de reglas, commit ni push en esta ronda.

## Alcance de la carpeta v2

Los documentos, reglas y funciones que estuvieron bajo `v2/` describían una arquitectura futura (Firestore, Custom Claims, App Check y Functions) y contenían cantidades de cartas obsoletas. No eran parte del MVP desplegado ni código Kotlin/Web listo para compilar. Los hallazgos compatibles sobre `gameData` y la declaración de edad quedan resumidos aquí. Se adoptaron de la configuración Hosting de v2 cabeceras defensivas que no cambian el flujo; se dejó fuera la CSP propuesta hasta probar cada recurso del cliente. Las reglas, funciones y Firestore de v2 no se integraron.

### Cierre de pruebas y publicación 1.21 — 31/10/2026

Se confirmó en Edge 40 Pro y Edge 40 Neo (sala desechable) presencia compartida, una misma carta Nivel 1, transferencia de «Robar este reto» al no titular y avance de turno al finalizar. El comodín sin carta está deshabilitado. Sigue pendiente comodín sobre Nivel 2/3, validar el saldo/doble toque, expiración completa de turno y cliente web tercero. La APK 1.21 fue recompilada e instalada en los dos equipos. El sitio `complices-en-juego.web.app` recibió solo el target `hosting:complices` y respondió HTTP 200. Reglas Firebase sin cambios. Verificar la sección de estado Git más reciente antes de nuevas acciones.
