# Estrategia de implementación segura

## Principio

La conexión que ya funcionaba se trata como **núcleo congelado**. Las mejoras nuevas se montan encima y por separado.

## Capas

### 1. Núcleo base
`index.html` conserva el JavaScript original de autenticación, Microsoft Graph, resolución del Excel, sesiones, lectura/escritura, OCR, tablas y sincronización.

### 2. Presentación
`assets/fias-ui.css` moderniza la interfaz sin tocar funciones ni endpoints.

### 3. Mejoras de experiencia
`assets/fias-enhancements.js` trabaja sobre el DOM final: rol visual, ocultamiento de controles de escritura para usuarios de consulta, resumen compacto de conexión, simplificación de validaciones y agenda preventiva derivada de la predicción existente.

## Seguridad

El front-end oculta y bloquea controles de escritura para cuentas distintas de `jcruzg@fias.org.ec`.

La seguridad definitiva debe quedar además en la fuente: permisos de SharePoint/OneDrive configurados con edición para la cuenta administradora y lectura para los demás usuarios.

## Recuperación

`BASE_ORIGINAL_NO_MODIFICAR.html` es la copia exacta del archivo funcional recibido. Si una mejora visual presentara un problema, permite volver inmediatamente a la base sin perder la conexión.
