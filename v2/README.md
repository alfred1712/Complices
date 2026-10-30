# 🔥 Chispa — Versión 2 (Desarrollo)

> ⚠️ Este directorio es el entorno de **desarrollo activo de la nueva versión**.
> La versión estable actual se encuentra en el directorio raíz del proyecto (`/android-app` y `/web`).
> **NO mezclar ni copiar cambios de v2 a producción sin revisión arquitectónica.**

---

## 📁 Estructura del Directorio

```
v2/
├── android-app/               # App Android nativa (Kotlin) — Arquitectura Clean + MVVM
│   └── app/src/main/java/com/chispa/app/
│       ├── data/
│       │   ├── repository/    # Implementaciones de repositorios (Firebase, local)
│       │   ├── remote/        # DTOs, Firebase datasources, API calls
│       │   └── local/         # Room DB, DataStore, caché local
│       ├── domain/
│       │   ├── model/         # Entidades de dominio puras (sin dependencias Android/Firebase)
│       │   └── usecase/       # Casos de uso (lógica de negocio)
│       ├── ui/
│       │   ├── screens/       # Composables de pantalla completa
│       │   ├── components/    # Componentes reutilizables (ruleta, carta, etc.)
│       │   └── viewmodel/     # ViewModels por feature
│       └── di/                # Módulos de inyección de dependencias (Hilt)
├── web/                       # App Web (HTML/JS con Firebase SDK)
├── firebase/
│   ├── rules/                 # Reglas de seguridad Firestore y Storage
│   └── functions/             # Cloud Functions (Node.js)
└── docs/                      # Documentación técnica, diagramas de arquitectura
```

---

## 🎯 Objetivo de esta Versión

| Área              | Meta Principal                                                  |
|-------------------|-----------------------------------------------------------------|
| **Arquitectura**  | Migrar de WebView monolítico a app nativa Kotlin + Jetpack      |
| **Seguridad**     | Reforzar reglas Firestore, autenticación y control de contenido |
| **Rendimiento**   | Eliminar dependencia de WebView para lógica de juego            |
| **Escalabilidad** | Preparar estructura para modos de juego adicionales             |

---

## 📋 Convenciones de Trabajo

- Todo el **código** en inglés (variables, funciones, clases, comentarios en código).
- Toda la **comunicación y documentación** en español.
- Commits con prefijo: `[v2]` para distinguir de cambios en producción.
- Nunca modificar archivos fuera de este directorio `v2/` sin confirmación explícita.

---

## 🔄 Estado del Análisis Arquitectónico

- [x] Exploración inicial del proyecto actual
- [x] Creación del entorno de trabajo v2
- [ ] Auditoría de seguridad Firebase (reglas Firestore/Storage)
- [ ] Análisis del código Android actual (MainActivity.java + WebView)
- [ ] Propuesta de arquitectura nueva (Clean Architecture + Jetpack Compose)
- [ ] Diseño del modelo de datos Firestore v2

---

*Creado: Octubre 2026 — Arquitecto: AI Senior (Antigravity)*
