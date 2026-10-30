# Chispa Web

La web comparte el mismo HTML y backend Firebase que el APK. Para desplegarla en Firebase Hosting, desde la raíz del proyecto:

```powershell
firebase login
firebase deploy --only hosting
```

La URL inicial será `https://juego-cruzado.web.app` (o el dominio Hosting que figure habilitado en Firebase Console). En Authentication > Settings > Authorized domains, confirma que el dominio publicado esté permitido para inicio de sesión anónimo.

Las parejas pueden usar el mismo código de sala desde el navegador o el APK. Para invitar, abre la pestaña Sala y comparte el enlace/código generado.
