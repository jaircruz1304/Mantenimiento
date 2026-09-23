(function(root){
  'use strict';
  const STATUS_WEIGHT={overdue:100,upcoming:70,programmed:35,unknown:20,ok:0};

  function buildAlerts(vehicleAnalyses){
    const alerts=[];
    (vehicleAnalyses||[]).forEach(v=>{
      (v.services||[]).forEach(s=>{
        if(s.status==='overdue') alerts.push({severity:'high',score:100+(s.criticality==='alta'?15:0),plate:v.plate,title:`${v.plate} · ${s.label}`,text:s.reason || 'Intervención vencida según la regla aplicable.',serviceId:s.id});
        else if(s.status==='upcoming') alerts.push({severity:'med',score:70+(s.criticality==='alta'?10:0),plate:v.plate,title:`${v.plate} · ${s.label}`,text:s.reason || 'Intervención próxima.',serviceId:s.id});
      });
      (v.recurrences||[]).forEach(r=>alerts.push({severity:'med',score:68,plate:v.plate,title:`${v.plate} · Reincidencia técnica`,text:`${r.label}: ${r.count} intervenciones en ${r.windowDays} días.`,serviceId:r.family}));
      if(v.costTrend && v.costTrend.hasBasis && v.costTrend.changePct>=35){
        alerts.push({severity:'med',score:55,plate:v.plate,title:`${v.plate} · Incremento de costos`,text:`El costo de los últimos 12 meses aumentó ${Math.round(v.costTrend.changePct)}% frente a los 12 meses previos.`,serviceId:'cost'});
      }
    });
    return alerts.sort((a,b)=>b.score-a.score);
  }

  function summary(vehicleAnalyses){
    const counts={overdue:0,upcoming:0,programmed:0,ok:0,unknown:0};
    (vehicleAnalyses||[]).forEach(v=>(v.services||[]).forEach(s=>{ if(counts[s.status]!==undefined) counts[s.status]++; }));
    return counts;
  }

  root.FIAS_Alerts = Object.freeze({buildAlerts,summary,STATUS_WEIGHT});
})(globalThis);
