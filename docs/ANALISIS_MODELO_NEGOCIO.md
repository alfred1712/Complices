# Cómplices — evaluación del modelo de negocio

**Revisión:** 30 de octubre de 2026. Evaluación de producto, no dictamen legal, fiscal ni aprobación de ningún proveedor de pagos.

## Resumen ejecutivo

Cómplices puede probarse primero como producto web para adultos, acompañado por APK de distribución directa. No conviene financiar hoy una app de tienda ni construir una consola de pagos completa: el contenido explícito es incompatible con las políticas generales de Google Play y App Store consultadas. Stripe tampoco es una ruta apta: Argentina no figura entre los países admitidos para abrir una cuenta de pagos y Stripe prohíbe vender contenido adulto. Mercado Pago sí publica APIs, Checkout y suscripciones disponibles en Argentina, pero su documentación de integración no equivale a aprobación del rubro adulto. Antes de cobrar, se requiere confirmación escrita de elegibilidad del comercio y revisar obligaciones locales.

**Recomendación:** conservar el juego base gratuito y probar primero un pack temático de pago único en la web, solo después de confirmar un procesador. No limitar el modo multijugador básico a diez cartas. Posponer suscripción y consola amplia hasta medir retorno y repetición. Validar la versión física con preventa o tirada corta.

## Comparación de las cuatro opciones

| Modelo | Ventajas | Desventajas y riesgos | Viabilidad ahora | Recomendación |
| --- | --- | --- | --- | --- |
| Freemium: mazos abiertos y packs de pago | Encaja con probar el juego antes de pagar; los packs se pueden vender una vez y agregar por tema; permite experimentar con precio y demanda sin prometer contenido mensual. | Cobro y acceso requieren backend confiable; compras desde la APK pueden estar sujetas a reglas distintas según canal de distribución; una separación artificial del nivel 3 puede frustrar y no resolver elegibilidad de tiendas. Stripe no es opción para el caso actual. | **Media en web, condicionada** a aprobación del proveedor de pago; **baja en tiendas generalistas** por políticas de contenido. | Mantener gratis una partida completa y vender un pack piloto por pago único en web cuando Mercado Pago confirme el rubro. No usar 20% de Nivel 3 como supuesto de conversión; testear con un pack claramente descrito. |
| Cobrar por crear una sala privada | El valor de una sala persistente puede ser fácil de explicar; podría cubrir estado guardado, más cartas propias o herramientas de anfitrión; es posible cobrar una sola vez por sesión. | La sala compartida es la puerta de entrada y el mecanismo de invitación; ponerle un límite duro reduce la viralidad y hace que otros participantes dependan de quien paga. Una suscripción por una función ocasional puede sentirse desproporcionada. El costo de Firebase no crece de forma lineal con la cantidad de salas si estas son efímeras. | **Baja como barrera a la sala básica; media** para extras persistentes. | No cobrar por jugar en grupo ni por una sala efímera. Si se valida la demanda, cobrar por historial persistente, salas guardadas o herramientas del anfitrión; compartir el acceso premium con toda la sala durante esa partida. |
| Mazo físico / print-on-demand | Producto tangible para regalos; puede distinguir la marca del juego digital; permite validar interés y precio con prototipos o preventa sin desarrollar pagos dentro de la app. | Diseño, impresión, caja, logística, devoluciones, impuestos y privacidad del paquete añaden operación. Print-on-demand suele reducir stock pero también margen y control de calidad. Hay que revisar que imprenta, marketplace, publicidad y envío acepten la temática explícita. | **Media como experimento de preventa; baja como operación permanente antes de validar demanda.** | Crear un prototipo discreto de buena calidad y medir preventas. Diseñar identidad y textos propios; no copiar cartas, marcas, ilustraciones ni empaque de otros juegos. |
| Suscripción mensual de citas / mazos | Ingreso recurrente potencial; da motivo para volver; permite temporadas o paquetes mensuales con retos y guías para una noche de cita. Mercado Pago ofrece APIs de suscripción en Argentina. | Exige entregar valor todos los meses, gestionar cancelaciones, renovaciones, reembolsos y soporte; riesgo de churn alto si el uso real es esporádico. La elegibilidad del contenido adulto para pagos sigue sin estar confirmada. Agrega complejidad a la consola y a la identidad entre dispositivos. | **Baja al inicio; media si se demuestra retención y se obtiene aprobación de pagos.** | No comenzar con una suscripción. Medir uso de varias semanas/meses y probar primero packs únicos o una serie limitada de tres meses. Suscribirse solo si hay retorno repetido y calendario editorial sostenible. |

## Pagos, tiendas y canal de distribución

- **Google Play:** la política consultada no admite apps que contengan o promuevan contenido sexual destinado a estimular sexualmente. Un control de edad no elimina esa restricción. La política de pagos también exige Google Play Billing para bienes digitales en apps distribuidas por Play, salvo excepciones. Para el producto y cartas actuales, Google Play no es un canal con elegibilidad que debamos dar por sentada.
- **App Store:** la directriz 1.1.4 excluye material abiertamente sexual, incluyendo descripciones explícitas de órganos o actividades destinadas a estimular sentimientos eróticos. Una versión con el mismo contenido explícito tampoco debe presupuestarse para App Store.
- **Stripe:** Argentina no aparece en su lista actual de países admitidos para cuentas de pagos, y su lista de actividades prohibidas incluye contenido adulto destinado a gratificación sexual. No lo recomiendo para Cómplices en Argentina.
- **Mercado Pago:** ofrece integraciones, checkout y suscripciones en Argentina. Sin embargo, las páginas públicas de integración consultadas no confirman que acepten este negocio adulto. Antes de integrar, describir con precisión el producto, solicitar autorización escrita y revisar sus términos y tarifas vigentes.
- **Web/PWA y APK directa:** son las rutas iniciales más plausibles para probar el producto sin presuponer publicación en las tiendas generalistas. La distribución directa tiene fricción de instalación, actualización y confianza, y requiere políticas claras, soporte, seguridad y cumplimiento legal local.

Fuentes oficiales consultadas:

- [Política de contenido sexual de Google Play](https://support.google.com/googleplay/android-developer/answer/9878810?hl=en)
- [Política de pagos de Google Play para bienes digitales](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en)
- [Directrices de revisión de App Store, 1.1.4](https://developer.apple.com/app-store/review/guidelines/la/)
- [Disponibilidad global de Stripe](https://stripe.com/global)
- [Actividades prohibidas de Stripe](https://stripe.com/legal/restricted-businesses)
- [Inicio de integración de Mercado Pago Argentina](https://www.mercadopago.com.ar/developers/es/docs/getting-started)
- [Planes y facturación de Realtime Database](https://firebase.google.com/docs/database/usage/billing)

## Firebase y costos del modelo

El plan gratuito de Realtime Database tiene topes publicados (incluye hasta 1 GB almacenado y 10 GB de descargas al mes; la página de precios también muestra límite de conexiones simultáneas del plan). No es una plataforma sin límites. Si se monetiza o se habilitan servicios de backend, se deberán instrumentar alertas de presupuesto, medir descargas y revisar las condiciones del plan actual. La cuota gratuita reduce el costo del piloto, pero no sustituye presupuesto ni control de abuso.

Las compras no pueden validarse con un `premium: true` escrito desde JavaScript: cualquier cliente manipulable puede falsificarlo. Para vender, el backend debe recibir y validar notificaciones del procesador, hacer la asignación idempotente, mantener el estado de reembolsos/cancelaciones y exponer al cliente solo el derecho vigente. La tienda web y el APK deben consultar la misma fuente de derechos.

## ¿Hace falta una consola?

**Sí para monetizar y operar contenido; no como primera tarea aislada.** Una consola visible solo a administradores no es segura si el propio cliente decide quién es administrador. La autoridad debe estar del lado servidor.

### Consola mínima propuesta

1. Inicio de sesión de personal con identidad estable y segundo factor; roles distintos para propietario, soporte y editor de contenido.
2. Gestión/versionado de mazos y packs, publicar/despublicar, compatibilidad de versión, precio/estado comercial y contenido de prueba.
3. Búsqueda de usuarios/salas por ID interno, asignación/revocación de acceso de prueba, ver estado de pago, reembolso y expiración; no permitir ver contenido sexual de una sala salvo necesidad operativa documentada.
4. Registro de auditoría de cambios administrativos y de webhooks; nunca almacenar tarjetas ni secretos de pago en el cliente.
5. Gestión de reportes, abuso, eliminación/retención de datos y contacto de soporte antes de abrir cartas personalizadas a una comunidad pública.

### Diseño de acceso

- El juego actual usa Firebase Anonymous Auth. Esa identidad no es una cuenta portable entre dispositivos, por lo que no sirve sola para “restaurar compra”. Si la compra se asocia a un usuario, hará falta enlazar una identidad recuperable y diseñar restauración; alternativa simple para el piloto: el anfitrión paga y una partida entera hereda el acceso mientras dura.
- Roles administrativos o premium deben ser verificados por backend (por ejemplo, Custom Claims emitidas por Admin SDK o servicio equivalente), nunca por una bandera en `localStorage` o escrita por el cliente.
- El cliente actual tiene rutas RTDB compartidas. Una lectura de solo lectura de reglas el 30/10 confirmó que cualquier miembro anónimo autenticado de la sala puede escribir el `gameData` completo, sin validación por campo; la presencia sí limita escritura a su UID. Antes de añadir productos, privilegios o cartas públicas, definir permisos por ruta y probarlos con Emulator Suite. No reutilizar reglas futuras de `v2` sin adaptar y probar.
- La consola de contenido puede comenzar como herramienta interna. No hace falta exponer un catálogo público de cartas personalizadas ni conservar retos privados indefinidamente.

## Hitos recomendados

1. **Validar canal y proveedor (decisión de inversión):** pedir confirmación escrita a Mercado Pago sobre elegibilidad del producto y pagos digitales para adultos; consultar asesoría local sobre cobros, privacidad, términos, renovaciones e impuestos. Confirmar que se seguirá por web/PWA y APK directa salvo una revisión formal de tiendas.
2. **Mejorar el juego sin pagos:** implementar A–D de forma común en el HTML canónico y reflejar los cambios en el Web Hosting y el WebView Android; mantener una sola versión funcional. Los efectos de audio deben iniciar silenciados, ser opcionales, cortos y generados con Web Audio o con audio de licencia documentada. La música comercial no se incrusta sin licencia.
3. **Validar el valor:** medir de forma agregada (sin recolectar texto de retos) cuántas sesiones se inician/completan, cuántas repiten y qué packs despiertan interés. La opción de compartir un reporte debe excluir nombres, carta, texto íntimo e identificadores de sala.
4. **Probar un solo producto pagado:** un pack único en web, con backend de cobro/entitlements y acceso compartido en la sala. No ofrecer suscripción ni cerrar la experiencia básica hasta demostrar conversión y bajo nivel de reclamos.
5. **Consola interna y escala:** si el piloto funciona, agregar administración de packs y derechos, conciliación/reembolsos y soporte. Pasar de herramientas manuales a consola antes de crecer el volumen; definir métricas, costos y roles.
6. **Canales adicionales:** prototipo físico con preventa. Suscripción mensual solo después de ver uso recurrente. Revisar por separado elegibilidad de cada app store; no crear una variante engañosa que oculte el propósito o cambie contenido tras la revisión.

## Recomendación final

Mi opinión: **sí hay una oportunidad como experiencia web adulta de nicho**, y el producto puede validar interés con un coste técnico controlado. No veo justificación todavía para suscripción, una operación física continua ni un panel administrativo grande. La ruta más viable es web + APK directa, juego base completo gratuito, un pack de pago único tras autorización del procesador y una consola interna pequeña cuando haya compras que administrar. El mayor riesgo a resolver ahora no es programar el paywall: es confirmar que el proveedor acepta el rubro y diseñar el backend que impide falsificar el acceso.
