# FIAS · Gestión Vehicular Inteligente

Proyecto implementable sobre la base funcional existente de mantenimiento vehicular FIAS.

## Principio de arquitectura

El archivo `BASE_ORIGINAL_NO_MODIFICAR.html` es una copia exacta del HTML base funcional recibido. `index.html` conserva ese núcleo y añade únicamente:

1. una hoja de estilos externa;
2. un **bridge de solo lectura** que expone una copia de las tablas ya cargadas por el núcleo;
3. módulos externos de análisis preventivo, interfaz y permisos.

No se reemplazan las funciones originales de autenticación Microsoft 365, Graph, resolución del Excel, sesiones, sincronización, OCR ni guardado.

## Estructura

```text
/index.html
/BASE_ORIGINAL_NO_MODIFICAR.html
/assets/fias-ui.css
/config/maintenance-rules.js
/config/manufacturer-plans.js
/config/manufacturer-plan.template.csv
/intelligence/service-classifier.js
/intelligence/prediction-engine.js
/intelligence/alerts-engine.js
/intelligence/maintenance-engine.js
/ui/permissions.js
/ui/vehicle-profile.js
/ui/preventive-dashboard.js
/ui/app-bootstrap.js
/docs/*
/tests/*
/package.json
/VERSION.json
```

## Funcionalidad inteligente

- reconstruye el historial técnico por vehículo;
- calcula kilometraje actual usando el inventario y el historial;
- estima el ritmo de uso en km/mes con intervalos históricos válidos;
- clasifica trabajos realizados por componentes;
- determina último antecedente verificable por servicio;
- proyecta próximo kilometraje y fecha estimada;
- clasifica cada servicio como Vencido, Próximo, Programado, Al día o Sin información;
- detecta reincidencias de componentes;
- calcula tendencia de costos de 12 meses frente al período anterior;
- genera alertas preventivas;
- crea una ficha inteligente por vehículo;
- añade una pestaña `Plan preventivo` sin alterar el flujo del núcleo.

## Fuentes técnicas

Los intervalos incluidos en `maintenance-rules.js` son **reglas preventivas referenciales FIAS**, no se presentan como recomendaciones oficiales de fabricantes.

Los planes oficiales deben agregarse en `config/manufacturer-plans.js` únicamente con una fuente verificable. Cuando existe una coincidencia exacta por marca/modelo/año/motor, el motor da prioridad a esa regla.

## Seguridad

La cuenta administradora de interfaz es:

`jcruzg@fias.org.ec`

El resto de cuentas se muestra en modo consulta y se bloquean los controles de alta/modificación en la interfaz.

**La seguridad real debe reforzarse en SharePoint/OneDrive:** conceder edición únicamente a la cuenta administradora y lectura al resto. La restricción del navegador no sustituye permisos de origen.

## Publicación

Publicar la **carpeta completa** en GitHub Pages o el hosting utilizado actualmente. No publicar solo `index.html`.

Antes de producción ejecutar:

```bash
npm test
```

Luego probar autenticación, sincronización, consulta y escritura con las cuentas correspondientes.
