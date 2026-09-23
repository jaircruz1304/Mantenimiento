# Configuración de recomendaciones del fabricante

El proyecto no inventa intervalos oficiales. La colección `FIAS_MANUFACTURER_PLANS` se entrega vacía.

## Información mínima requerida

Por cada familia de vehículo:

- marca;
- modelo;
- rango de años;
- motor o versión cuando aplique;
- componente/servicio;
- intervalo por kilometraje;
- intervalo por tiempo;
- fuente oficial;
- enlace o referencia documental.

## Ejemplo de estructura

```javascript
{
  make: 'MARCA',
  model: 'MODELO',
  yearFrom: 2022,
  yearTo: 2026,
  engine: '2.0',
  sourceLabel: 'Manual de mantenimiento oficial',
  sourceUrl: 'https://...',
  rules: [
    { id: 'engine_oil', intervalKm: 10000, intervalMonths: 12 },
    { id: 'brake_fluid', intervalKm: 40000, intervalMonths: 24 }
  ]
}
```

El ejemplo muestra solamente el formato; los valores deben sustituirse por datos verificados del fabricante.

## Identificadores disponibles

- `engine_oil`
- `oil_filter`
- `air_filter`
- `cabin_filter`
- `fuel_filter`
- `brakes`
- `brake_fluid`
- `tires`
- `alignment`
- `coolant`
- `transmission_fluid`
- `battery`
- `timing_system`
- `general_service`

Cuando una regla oficial coincide con el vehículo, se identifica visualmente como `Fabricante` y reemplaza el intervalo referencial equivalente.
