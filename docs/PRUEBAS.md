# Matriz mínima de pruebas

| Prueba | Resultado esperado |
|---|---|
| Inicio Microsoft 365 | Acceso corporativo normal |
| Sincronizar | Se leen las tablas del Excel maestro |
| Resumen existente | KPIs y gráficos siguen visibles |
| Mantenimientos | Filtros, detalle y exportación siguen funcionando |
| Administrador | Puede ver controles de registro |
| Usuario consulta | No ve ni puede activar controles de escritura |
| Plan preventivo | Aparece después de cargar la aplicación |
| Ficha de vehículo | Muestra historial, servicios y proyecciones |
| Sin antecedente | El sistema muestra `Sin información`, no inventa fecha |
| Sin plan fabricante | La fuente se marca `FIAS referencial` |
| Con plan fabricante | La fuente se marca `Fabricante` |
| Móvil | Menú desplazable y tarjetas adaptadas |

## Prueba automatizada

Ejecutar:

```bash
npm test
```

La prueba comprueba estructura, sintaxis JavaScript, integridad del archivo base y que `index.html` solo difiera de la base por las extensiones declaradas.
