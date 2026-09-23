/* Reglas preventivas referenciales FIAS.
   IMPORTANTE: no se presentan como especificaciones del fabricante.
   El motor da prioridad a manufacturer-plans.js cuando existe una coincidencia exacta. */
(function(root){
  'use strict';
  const RULES = [
    {id:'engine_oil',label:'Aceite de motor',family:'LUBRICACION',intervalKm:10000,intervalMonths:12,upcomingKm:1500,upcomingDays:45,keywords:['aceite motor','cambio aceite','lubricante motor'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'oil_filter',label:'Filtro de aceite',family:'FILTRO_ACEITE',intervalKm:10000,intervalMonths:12,upcomingKm:1500,upcomingDays:45,keywords:['filtro aceite'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'air_filter',label:'Filtro de aire',family:'FILTRO_AIRE',intervalKm:20000,intervalMonths:24,upcomingKm:2500,upcomingDays:60,keywords:['filtro aire','filtro de aire'],sourceType:'FIAS_REFERENCIAL',criticality:'media'},
    {id:'cabin_filter',label:'Filtro de cabina',family:'FILTRO_CABINA',intervalKm:15000,intervalMonths:12,upcomingKm:2000,upcomingDays:45,keywords:['filtro cabina','filtro polen','filtro habitaculo'],sourceType:'FIAS_REFERENCIAL',criticality:'baja'},
    {id:'fuel_filter',label:'Filtro de combustible',family:'FILTRO_COMBUSTIBLE',intervalKm:30000,intervalMonths:24,upcomingKm:3000,upcomingDays:60,keywords:['filtro combustible','filtro diesel','filtro gasolina'],sourceType:'FIAS_REFERENCIAL',criticality:'media'},
    {id:'brakes',label:'Inspección de frenos',family:'FRENOS',intervalKm:10000,intervalMonths:6,upcomingKm:1500,upcomingDays:30,keywords:['freno','pastilla','disco','zapatas'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'brake_fluid',label:'Líquido de frenos',family:'LIQUIDO_FRENOS',intervalKm:40000,intervalMonths:24,upcomingKm:4000,upcomingDays:75,keywords:['liquido frenos','liquido de frenos'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'tires',label:'Neumáticos / rotación',family:'NEUMATICOS',intervalKm:10000,intervalMonths:12,upcomingKm:1500,upcomingDays:45,keywords:['llanta','neumatico','rotacion'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'alignment',label:'Alineación y balanceo',family:'ALINEACION_BALANCEO',intervalKm:10000,intervalMonths:12,upcomingKm:1500,upcomingDays:45,keywords:['alineacion','balanceo','enllantaje'],sourceType:'FIAS_REFERENCIAL',criticality:'media'},
    {id:'coolant',label:'Refrigerante',family:'REFRIGERANTE',intervalKm:40000,intervalMonths:24,upcomingKm:4000,upcomingDays:75,keywords:['refrigerante','coolant','anticongelante'],sourceType:'FIAS_REFERENCIAL',criticality:'media'},
    {id:'transmission_fluid',label:'Fluido de transmisión',family:'TRANSMISION',intervalKm:60000,intervalMonths:48,upcomingKm:5000,upcomingDays:90,keywords:['aceite transmision','fluido transmision','atf','aceite caja'],sourceType:'FIAS_REFERENCIAL',criticality:'alta'},
    {id:'battery',label:'Batería y sistema de carga',family:'BATERIA',intervalKm:null,intervalMonths:12,upcomingKm:null,upcomingDays:45,keywords:['bateria','alternador','sistema carga'],sourceType:'FIAS_REFERENCIAL',criticality:'media'},
    {id:'timing_system',label:'Correa/cadena de distribución',family:'DISTRIBUCION',intervalKm:null,intervalMonths:null,upcomingKm:null,upcomingDays:null,keywords:['correa distribucion','cadena distribucion','kit distribucion'],sourceType:'VERIFICAR_FABRICANTE',criticality:'alta',requiresManufacturer:true},
    {id:'general_service',label:'Servicio general programado',family:'SERVICIO_GENERAL',intervalKm:5000,intervalMonths:6,upcomingKm:1000,upcomingDays:30,keywords:['mantenimiento preventivo','servicio general','mantenimiento kilometraje'],sourceType:'FIAS_REFERENCIAL',criticality:'media'}
  ];
  root.FIAS_MAINTENANCE_RULES = Object.freeze(RULES.map(r=>Object.freeze({...r})));
})(globalThis);
