const path=require('path');
const root=path.resolve(__dirname,'..');
[
 'config/maintenance-rules.js','config/manufacturer-plans.js','intelligence/service-classifier.js','intelligence/prediction-engine.js','intelligence/alerts-engine.js','intelligence/maintenance-engine.js'
].forEach(f=>require(path.join(root,f)));

const snapshot={
  connected:true,
  tableNames:{vehicles:'tblVehiculos',maintenance:'tblMantenimientos',maintenanceDetail:'tblDetalleMantenimiento',invoices:'tblFacturas'},
  rows:{
    tblVehiculos:[{ID_Activo:'ACT-1',Placa:'ABC-1234',Marca:'Toyota',Modelo:'Demo',Año:2022,Odometro_Ultimo:30500}],
    tblMantenimientos:[
      {ID_Mantenimiento:'M-1',ID_Activo:'ACT-1',Placa:'ABC-1234',Fecha_Recepcion:'2026-01-10',Km:10000,Tipo_Mantenimiento:'Preventivo',Total_Con_IVA:300},
      {ID_Mantenimiento:'M-2',ID_Activo:'ACT-1',Placa:'ABC-1234',Fecha_Recepcion:'2026-04-10',Km:20000,Tipo_Mantenimiento:'Preventivo',Total_Con_IVA:340},
      {ID_Mantenimiento:'M-3',ID_Activo:'ACT-1',Placa:'ABC-1234',Fecha_Recepcion:'2026-07-10',Km:30000,Tipo_Mantenimiento:'Preventivo',Total_Con_IVA:380}
    ],
    tblDetalleMantenimiento:[
      {ID_Mantenimiento:'M-1',Descripcion:'Cambio aceite motor y filtro aceite'},
      {ID_Mantenimiento:'M-2',Descripcion:'Cambio aceite motor, filtro aceite, filtro aire'},
      {ID_Mantenimiento:'M-3',Descripcion:'Cambio aceite motor y filtro aceite; alineación y balanceo'}
    ],
    tblFacturas:[]
  }
};
const result=globalThis.FIAS_MaintenanceEngine.analyzeSnapshot(snapshot,new Date('2026-09-23T12:00:00Z'));
if(result.vehicles.length!==1) throw new Error('No analizó vehículo.');
const v=result.vehicles[0];
if(v.currentKm!==30500) throw new Error('Km actual incorrecto: '+v.currentKm);
if(!(v.usage.kmMonth>0)) throw new Error('No calculó ritmo de uso.');
const oil=v.services.find(s=>s.id==='engine_oil');
if(!oil||!oil.lastEvidence) throw new Error('No detectó aceite.');
if(oil.nextKm!==40000) throw new Error('Próximo aceite incorrecto: '+oil.nextKm);
const timing=v.services.find(s=>s.id==='timing_system');
if(!timing||timing.status!=='unknown') throw new Error('Distribución debe requerir fabricante.');
console.log('Engine test OK.',{plate:v.plate,currentKm:v.currentKm,kmMonth:Math.round(v.usage.kmMonth),oilNextKm:oil.nextKm});
