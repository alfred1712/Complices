# Cómplices Web — publicación

La guía operativa del MVP, el backend activo, pruebas y recuperación está en [`MVP-OPERATIONS.md`](MVP-OPERATIONS.md).

El proyecto Firebase existente es `juego-cruzado`. La aplicación se publica únicamente en:

- Cómplices: `https://complices-en-juego.web.app` (target `complices`).
- `https://juego-cruzado.web.app` es el sitio Hosting predeterminado. Firebase no permite borrarlo; se mantiene retirado con una página que redirige a Cómplices (target `legacy-redirect`) y no debe volver a alojar la app.

Desde la raíz, el deploy selectivo es:

```powershell
firebase deploy --only hosting:complices --project juego-cruzado
```

Solo para actualizar la redirección del dominio anterior:

```powershell
firebase deploy --only hosting:legacy-redirect --project juego-cruzado
```

No utilizar `--site`; Firebase CLI selecciona el sitio por deploy target. El deploy de Cómplices no publica reglas ni Functions. Verificar que el nuevo dominio esté autorizado en Authentication antes de validar inicio de sesión.
