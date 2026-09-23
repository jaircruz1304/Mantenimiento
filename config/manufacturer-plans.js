/* Planes oficiales del fabricante.
   Esta colección se entrega vacía deliberadamente: no se inventan intervalos oficiales.
   Agregue registros únicamente cuando exista manual/plan de mantenimiento verificable.

   Ejemplo de estructura (NO es un dato real, por eso está comentado):
   {
     make:'MARCA', model:'MODELO', yearFrom:2022, yearTo:2026, engine:'2.0',
     sourceLabel:'Manual de mantenimiento oficial', sourceUrl:'https://...',
     rules:[{id:'engine_oil', intervalKm:10000, intervalMonths:12}]
   }
*/
(function(root){
  'use strict';
  root.FIAS_MANUFACTURER_PLANS = Object.freeze([]);
})(globalThis);
