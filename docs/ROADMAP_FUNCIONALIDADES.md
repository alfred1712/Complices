# Cómplices — propuesta funcional A–D

Este documento conserva la propuesta y la primera implementación de A–D en la versión 1.16; es un registro histórico, no la especificación del cliente vigente. Desde entonces se retiró el sonido ambiente en 1.18 y se incorporaron los turnos, comodines y toma del reto en 1.20. Para el comportamiento actual, consultar `docs/ESTADO_ACTUAL.md` y `MVP-OPERATIONS.md`. No desplegar reglas RTDB sin auditoría previa.

## A. Animación y temporizador

**Implementado:** se conserva la ruleta actual; cada cliente anima una carta de dorso al detectar un `drawId` nuevo. El temporizador con iniciar/pausar se sincroniza dentro de la carta activa de `gameData` y usa el desfase horario de Firebase. La duración se detecta provisionalmente del texto de la carta.

**Pendiente:** auditar la duración detectada en todas las cartas y migrar a `durationSeconds` explícito donde una carta tenga varias duraciones o acciones repetidas. Probar dos clientes; definir el comportamiento al pausar o cerrar app. La animación respeta `prefers-reduced-motion`.

**Riesgo:** clientes antiguos no tienen animación ni controles del timer. Sus transacciones normalmente conservan campos desconocidos, pero hace falta una prueba de convivencia de versiones antes de mezclar APK 1.15 y web 1.16.

## B. Audio y ambiente

**Implementado:** botones opcionales en cabecera para efectos y un ambiente armónico sintetizado con Web Audio. Ambos evitan archivos externos; el ambiente comienza apagado y requiere una acción del jugador. Los SFX son tonos breves generados localmente.

**Pendiente/riesgos:** todavía no es una pista Lo-Fi/Lounge completa. Revisar volumen percibido, audio en segundo plano/suspensión del Android WebView y consumo de batería; respetar el silencio del dispositivo. No incluir música protegida sin derechos.

## C. Cartas personalizadas

**Implementado:** formulario antes del primer giro, nivel seleccionado, texto plano limitado a 240 caracteres, máximo 12 por sala, y mezcla en el mazo del nivel. No se guarda ni muestra el autor.

**Privacidad:** “anónima” significaría sin autor visible para otros jugadores; no es secreto frente a quien inspeccione Firebase o el dispositivo. Todos los miembros de la sala deben poder leer la carta para jugar. Mantenerlas por sala, no indexarlas públicamente ni reutilizarlas en otras salas; definir borrado al reiniciar/cerrar partida.

**Seguridad:** la app usa Anonymous Auth y las reglas activas RTDB todavía no están verificadas en este plan. Antes de lanzar UGC fuera de un grupo de confianza, diseñar validación, límites, reporte, bloqueo, retención y moderación; si hay publicación pública, no basta una caja de texto en el cliente.

## D. Reporte de complicidad

**Implementado:** cierre manual y al resolver la última carta; calcula finalizadas, omitidas, porcentaje de las resueltas e intensidad más alta resuelta. El porcentaje es descriptivo, no califica a las personas ni presupone que deban cumplir.

**Compartir:** generar una imagen neutral (marca, conteo, nivel máximo) sin nombres, código de sala, carta ni texto sexual. Usar Web Share API si está disponible y fallback guardar/descargar la imagen; probar WebView Android y navegador.

**Implementado:** cierre sincronizado de sesión y estado pendiente si se cierra con carta activa. **Pendiente:** probar compartir imagen en Web Share API y fallback de descarga en Android/WebView; probar varias sesiones/reinicios con dos dispositivos.

## Orden sugerido

1. Probar A–D en navegador y dos teléfonos; confirmar paridad, estado compartido, timer, cierre y tarjeta gráfica.
2. Auditar las reglas RTDB activas antes de publicar; no se han consultado ni modificado en este cambio.
3. Probar cartas propias en salas de confianza y definir borrado al reiniciar/cerrar. Para producto abierto se requiere moderación, reporte y controles de servidor.
4. No integrar Mercado Pago ni consola premium hasta completar el hito de elegibilidad descrito en `ANALISIS_MODELO_NEGOCIO.md`.

No se propone integrar Mercado Pago ni crear una consola premium hasta completar el hito de elegibilidad descrito en `ANALISIS_MODELO_NEGOCIO.md`.
