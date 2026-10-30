# Cómplices — operación del MVP

Estado revisado: 30 de octubre de 2026. Este documento describe la aplicación que hoy está en producción y los procedimientos del checkout raíz. No constituye autorización para desplegar reglas de base de datos.

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

Si ese fragmento reflejara las reglas activas, cada UID anónimo que figure en `miembros` podría escribir el `gameData` completo. Eso incluye cambiar/eliminar cartas disponibles, alterar modo e intensidad, inventar o borrar historial, modificar `scores`/`wildcardUsage` de cualquier nombre y sustituir la carta activa. La regla de presencia limita la escritura al UID propio y exige `name` string y `ts` número, pero no impone límites de longitud ni prohíbe campos extra. El fragmento local no prueba que esto sea lo que está desplegado.

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

## Compilar e instalar Android

Configuración activa en `android-app/app/build.gradle`: AGP 9.3.2, compile SDK 37, min SDK 23, target SDK 35, `applicationId com.chispa.app`, versión 1.15 (16). No hay Gradle Wrapper en el repositorio; la compilación 1.15 fue exitosa el 30/10 con Gradle 9.7.1 y Android Studio JBR 25. La APK de depuración resultante es `android-app/app/build/outputs/apk/debug/app-debug.apk`; la copia práctica `Complices-1.15-debug.apk` en la raíz se ignora en Git. Un checkout limpio necesita Android Studio/SDK configurados y una instalación compatible de Gradle.

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
- Smoke test de dispositivo único: abre, confirma mayoría de edad, inicia sesión, fija nombre, comprueba sala, mazos, ajustes, reglas, historial y reinicio solo en una sala de prueba.
- Prueba multi-dispositivo requiere dos Android conectados y autorizados en ADB: unir ambos a una sala desechable; confirmar presencia, aviso de carta, estado compartido, intensidad, finalización/omisión, comodines, desconexión y reconexión. La instalación 1.14 fue confirmada anteriormente en el Edge 40 Pro; la del Edge 40 Neo quedó sin confirmar. En la revisión del 30/10 ADB no mostró dispositivos.
- No usar producción para probar reglas ni reinicios. El cliente tiene el endpoint Firebase de producción incrustado y el `firebase.json` raíz no configura emuladores de RTDB; una prueba local de Hosting por sí sola no aísla las escrituras del backend.
- Antes de cambios futuros: comprobar `git status`, conservar el diff, validar copias, compilar y usar una sala desechable. Para recuperar Hosting, usar el historial de releases del sitio afectado en Firebase Console; restaurar el APK anterior desde el respaldo de releases.

## Alcance de la carpeta v2

Los documentos, reglas y funciones que estuvieron bajo `v2/` describían una arquitectura futura (Firestore, Custom Claims, App Check y Functions) y contenían cantidades de cartas obsoletas. No eran parte del MVP desplegado ni código Kotlin/Web listo para compilar. Los hallazgos compatibles sobre `gameData` y la declaración de edad quedan resumidos aquí. Se adoptaron de la configuración Hosting de v2 cabeceras defensivas que no cambian el flujo; se dejó fuera la CSP propuesta hasta probar cada recurso del cliente. Las reglas, funciones y Firestore de v2 no se integraron.
