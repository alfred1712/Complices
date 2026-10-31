# Plan de desarrollo priorizado

Actualizado: 31 de octubre de 2026. Este plan conserva el MVP y separa tareas confirmadas de decisiones que requieren al propietario. No autoriza despliegues ni cambios remotos.

## P0 — Cierre de 1.21 (parcialmente completado)

1. **Completado:** inspección del estado local y diff preservando capturas/logs existentes; `assembleDebug` e instalación 1.21 en dos Motorola; prueba APK–APK para carta sincronizada, robo de reto y avance al finalizar; deploy selectivo de `hosting:complices` verificado por HTTP 200.
2. **Pendiente:** probar en sala desechable entradas inocuas de XSS y verificar que nombres/cartas se rendericen como texto, sin ejecutar markup. **Dependencia:** cliente(s) y sala desechable. **Riesgo:** cambios XSS no probados pueden romper templates.
3. **Parcial:** abrir/ingresar a sala y sincronizar carta quedaron probados en dos Android. Faltan prueba completa de comodín Nivel 2/3 y su saldo, doble toque, expiración de turno y sesión APK–APK–Web. No se debe inferir éxito por el build.

## P1 — Reglas RTDB seguras sin romper salas

1. Exportar de nuevo las reglas desplegadas con acceso solo lectura y guardarlas temporalmente fuera de Git; compararlas con `database.rules.fragment.json`.
2. Crear un ruleset completo versionado solo después de modelar todas las escrituras reales del cliente: creación de miembro, migración, reinicio, estado inicial, carta personalizada, acciones, comodines y presencia. Las reglas de `v2/` no son compatibles por defecto.
3. Añadir pruebas del Emulator Suite para no autenticado, usuario no miembro, miembro, payload válido/inválido, límites y operaciones del juego; verificar la transacción que escribe el estado completo.
4. Mantener una matriz con APK 1.20/1.21 y web durante la transición; definir cómo manejar clientes antiguos y salas activas.
5. Presentar y revisar el diff con el usuario antes de cualquier despliegue de reglas. Desplegar solo con autorización explícita y un plan de rollback.

**Riesgo alto:** las reglas actuales son permisivas, pero endurecerlas sin pruebas puede bloquear el juego o dejar partidas antiguas inaccesibles. No sustituirlas a ciegas.

## P2 — Abuso, privacidad y contenido

- Evaluar App Check en modo monitor y restricciones de API key desde Firebase/Google Cloud; documentar dominios/package y huellas reales, revisar métricas antes de enforcement. No incluir claves privadas.
- Definir ciclo de vida/retención para nombres, cartas propias e historial de sala. Cualquier expiración/borrado automático necesita decisión de producto y mecanismo servidor; no borrar datos en un cambio de Hosting.
- Considerar aviso de privacidad accesible desde la app y verificar por separado requisitos de jurisdicción/tiendas si se planifica distribución pública.
- Evaluar `FLAG_SECURE` solo con decisión de producto: mejora privacidad de pantalla, pero impide capturas del teléfono.

## P3 — Calidad y rendimiento medidos

- Registrar línea base de Lighthouse móvil, tiempo de arranque, bytes y lecturas/escrituras de RTDB antes de optimizar.
- Reducir Tailwind CDN, mover CSS estático y/o empaquetar SDK Firebase en una iniciativa propia con comparación web/WebView y sin dependencias nuevas no aprobadas.
- Automatizar hash de las tres copias, análisis de JavaScript/JSON/XML y build Android. Añadir CI y wrapper Gradle solo tras revisar permisos/versiones y estrategia de mantenimiento.
- Diseñar pruebas de lógica pura (turnos, comodines, selección) y E2E multi-cliente contra emuladores, nunca contra la sala personal de producción.
- CSP se mantiene pendiente: comenzar en report-only después de enumerar y probar los orígenes del CDN, Firebase Auth/RTDB y WebView.

## P4 — Producto (no iniciar como parte de estabilización)

Preferencias de contenido, pausa global, modo discreto, filtros/moderación de cartas propias, cierre y cuidado posterior, temas, modo a distancia e internacionalización son propuestas. Acordar alcance y reglas de producto antes de implementar; la propuesta v2/premium no es parte del MVP.

## Fuera de alcance por ahora

Migrar a Firestore/Kotlin, cambiar `applicationId`, project ID o endpoints, habilitar pagos, borrar salas, modificar reglas de producción o publicar en tiendas. Cualquiera requiere decisión explícita, diseño y validación independiente.
