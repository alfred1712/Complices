# Cómplices

Cómplices es una app web para adultos que también se distribuye como APK Android. La interfaz activa está escrita en HTML/CSS/JavaScript; Android la presenta en un WebView local. Las salas y el estado compartido usan Firebase Authentication anónima y Realtime Database.

## Proyecto activo

- Fuente HTML canónica: `index5-final-v4.html`.
- Firebase Hosting: [complices-en-juego.web.app](https://complices-en-juego.web.app).
- APK Android: módulo `android-app/app`, `applicationId` `com.chispa.app`.
- Proyecto Firebase/backend existente: `juego-cruzado` (se conserva por compatibilidad).
- El sitio Hosting predeterminado `juego-cruzado.web.app` no se puede borrar; sirve únicamente una redirección a la web Cómplices.

## Requisitos y compilación

Se necesita Android Studio con SDK Android 37 y JDK compatible; esta revisión compiló con Gradle 9.7.1 y Android Studio JBR. No hay Gradle Wrapper en el repositorio. En PowerShell, con Gradle instalado y `JAVA_HOME` configurado:

```powershell
gradle -p android-app assembleDebug
```

APK de depuración: `android-app/app/build/outputs/apk/debug/app-debug.apk`. La release distribuible requiere generar una APK firmada con una keystore que no debe agregarse al repositorio. Para la guía de publicación, backend, pruebas y recuperación, consulta `MVP-OPERATIONS.md`.

## Documentación y continuidad

- `AGENTS.md`: normas de trabajo y traspaso entre agentes.
- `docs/ESTADO_ACTUAL.md`: auditoría y validación más reciente.
- `docs/ROADMAP_FUNCIONALIDADES.md`: diseño y dependencias de las mejoras A–D solicitadas.
- `docs/ANALISIS_MODELO_NEGOCIO.md`: pros/contras, canales, pagos y propuesta de consola.
- `MVP-OPERATIONS.md`: arquitectura activa, Firebase, seguridad, Hosting, APK y pruebas.
- `WEB-HOSTING.md`: despliegues selectivos de Hosting.
- `cartas-complices.md` / `.csv`: exportación del mazo activo.

Antes de cualquier tarea, lee `AGENTS.md` y comprueba el estado de Git. Las pruebas que usan Firebase deben realizarse en una sala desechable.
