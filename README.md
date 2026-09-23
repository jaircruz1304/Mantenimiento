# FIAS · Gestión Vehicular — versión estable

Esta versión se construyó con una regla principal: **no modificar el núcleo de conexión que ya funcionaba**.

## Arquitectura

- `index.html` — copia del HTML base funcional. El bloque JavaScript original de Microsoft 365 / Microsoft Graph / Excel / SharePoint se conserva sin cambios.
- `assets/fias-ui.css` — capa visual independiente: menú, responsive, jerarquía, compactación y presentación.
- `assets/fias-enhancements.js` — mejoras de interfaz, control visual de rol y agenda preventiva. No reemplaza la sincronización.

## Cuenta administradora

La interfaz reconoce como administradora a:

`jcruzg@fias.org.ec`

Las demás cuentas autenticadas se muestran en modo consulta y se ocultan/bloquean los controles de registro.

> **Importante:** el control real de seguridad debe reforzarse también en SharePoint/OneDrive: el libro maestro debe conceder edición únicamente a la cuenta administradora y lectura a los demás usuarios. La restricción del navegador mejora la experiencia y evita acciones accidentales, pero no sustituye permisos del origen de datos.

## Qué NO se cambió

- `tenantId`
- `clientId`
- `shareTokenOrUrl`
- scopes de Microsoft Graph
- resolución del `driveItem`
- creación/cierre de sesión Excel
- lectura de tablas
- modo binario XLSX
- sincronización
- funciones de Graph
- OCR existente
- formularios y guardado original

## Publicación en GitHub Pages

Subir **la carpeta completa**, manteniendo esta estructura:

```
/index.html
/assets/fias-ui.css
/assets/fias-enhancements.js
```

No publicar únicamente `index.html`, porque se perderán los estilos y mejoras externas.

## Prueba recomendada antes de reemplazar producción

1. Publicar esta carpeta en una rama o repositorio de prueba.
2. Iniciar sesión con Microsoft 365.
3. Ejecutar `Sincronizar`.
4. Confirmar que aparecen KPIs, mantenimientos, vehículos, facturas y predicciones.
5. Probar con `jcruzg@fias.org.ec` que se muestran los controles de registro.
6. Probar con una cuenta de consulta que esos controles no aparezcan.
7. Solo después sustituir la versión productiva.
