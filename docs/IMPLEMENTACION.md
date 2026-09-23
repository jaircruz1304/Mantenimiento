# Implementación paso a paso

## 1. Hacer respaldo

Conserve la versión productiva actual y el Excel maestro de SharePoint sin cambios.

## 2. Publicar en entorno de prueba

Suba todo el contenido del proyecto manteniendo exactamente las carpetas. `index.html` requiere los archivos externos de `assets`, `config`, `intelligence` y `ui`.

## 3. Validar conexión existente

1. Iniciar sesión con Microsoft 365.
2. Presionar `Sincronizar`.
3. Confirmar que siguen cargando KPIs, mantenimientos, vehículos, integridad, OCR y bitácora.
4. Confirmar que el estado de conexión indica `Conectado`.

Si esto falla, no continúe con producción. Compare con `BASE_ORIGINAL_NO_MODIFICAR.html`.

## 4. Validar motor preventivo

Después de sincronizar debe aparecer `Plan preventivo` en el menú. El motor toma una copia de los datos ya cargados por el núcleo y no abre una segunda sesión Excel.

Revisar al menos tres vehículos con historial conocido y contrastar:

- kilometraje actual;
- último mantenimiento;
- detalle de trabajos;
- servicios detectados;
- próxima proyección;
- estado preventivo.

## 5. Configurar seguridad de SharePoint

En el archivo maestro:

- `jcruzg@fias.org.ec`: Editor;
- demás usuarios: Lectura.

La aplicación oculta y bloquea controles para usuarios de consulta, pero SharePoint debe ser la barrera definitiva de escritura.

## 6. Incorporar planes de fabricante

Usar `docs/CONFIGURAR_FABRICANTE.md`. No registrar intervalos sin documento oficial verificable.

## 7. Paso a producción

Solo sustituya la versión publicada cuando:

- la conexión funcione;
- la sincronización termine correctamente;
- el administrador pueda registrar;
- un usuario de consulta no pueda modificar;
- las proyecciones hayan sido contrastadas con casos reales.
