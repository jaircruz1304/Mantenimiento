(function(root){
  'use strict';
  const P=()=>root.FIAS_Prediction;
  const C=()=>root.FIAS_ServiceClassifier;

  function clean(v){ return String(v??'').trim(); }
  function normalize(v){ return C().normalize(v); }
  function first(row, keys){ for(const k of keys){ if(row && row[k]!==undefined && row[k]!==null && String(row[k]).trim()!=='') return row[k]; } return ''; }
  function vehicleId(v){ return clean(first(v,['ID_Activo','Id_Activo','ID','Id','Codigo','Código'])); }
  function plateOf(v){ return clean(first(v,['Placa','PLACA','placa'])); }
  function makeOf(v){ return clean(first(v,['Marca','MARCA','Fabricante'])); }
  function modelOf(v){ return clean(first(v,['Modelo','MODELO','Version','Versión'])); }
  function yearOf(v){ return Number(first(v,['Año','Anio','ANIO','Year','Modelo_Año']))||null; }
  function engineOf(v){ return clean(first(v,['Motor','Cilindraje','Version_Motor','Versión_Motor'])); }

  function getRows(snapshot,key){
    const table=snapshot?.tableNames?.[key];
    return table ? (snapshot.rows?.[table]||[]) : [];
  }

  function maintenanceDate(r){ return first(r,['Fecha_Facturacion_Emision','Fecha_Recepcion','Fecha','Fecha_Mantenimiento']); }
  function maintenanceKm(r){ return P().num(first(r,['Km','Kilometraje','Odometro','Odómetro'])); }
  function maintenanceCost(r){ return P().num(first(r,['Total_Control','Total_Con_IVA','Subtotal_Sin_IVA','Total'])); }

  function historyForVehicle(v, maintRows, invoiceRows){
    const id=vehicleId(v), plate=plateOf(v);
    const same=(r)=> (id && clean(r.ID_Activo)===id) || (plate && normalize(r.Placa)===normalize(plate));
    const base=(maintRows||[]).filter(same).map(r=>({
      raw:r,id:clean(r.ID_Mantenimiento),date:maintenanceDate(r),km:maintenanceKm(r),cost:maintenanceCost(r),plate:clean(r.Placa||plate)
    }));
    // Facturas aportan puntos adicionales de odómetro para estimar ritmo de uso, sin duplicar mantenimientos.
    const invoice=(invoiceRows||[]).filter(same).map(r=>({raw:r,id:'INV:'+clean(r.Factura_Nro),date:first(r,['Fecha_Emision','Fecha_Autorizacion']),km:P().num(r.Km),cost:P().num(r.Total_Factura),plate:clean(r.Placa||plate),invoiceOnly:true}));
    return [...base,...invoice].filter(x=>x.date||x.km).sort((a,b)=>{
      const da=P().parseDate(a.date), db=P().parseDate(b.date); return (da?da.getTime():0)-(db?db.getTime():0);
    });
  }

  function currentKm(v, history){
    const candidates=[
      P().num(first(v,['Odometro_Ultimo','Odómetro_Ultimo','Odometro_Actual','Kilometraje_Actual','Km_Actual','Km']))
    ];
    (history||[]).forEach(h=>candidates.push(P().num(h.km)));
    return Math.max(0,...candidates);
  }

  function detailsForMaintenance(record, detailRows){
    const id=clean(record.ID_Mantenimiento), order=clean(record.Orden_Reparacion), invoice=clean(record.Factura_Nro);
    return (detailRows||[]).filter(d=>
      (id && clean(d.ID_Mantenimiento)===id) ||
      (order && clean(d.Orden_Reparacion)===order) ||
      (invoice && clean(d.Factura_Nro)===invoice)
    );
  }

  function matchManufacturerPlan(v){
    const plans=root.FIAS_MANUFACTURER_PLANS||[];
    const make=normalize(makeOf(v)), model=normalize(modelOf(v)), engine=normalize(engineOf(v)), year=yearOf(v);
    let best=null, score=-1;
    for(const plan of plans){
      if(normalize(plan.make)!==make || normalize(plan.model)!==model) continue;
      if((plan.yearFrom||plan.yearTo) && !year) continue;
      if(plan.yearFrom && year<plan.yearFrom) continue;
      if(plan.yearTo && year>plan.yearTo) continue;
      if(plan.engine && !engine) continue;
      if(plan.engine && !engine.includes(normalize(plan.engine))) continue;
      const s=2+(plan.engine?2:0)+(year?1:0);
      if(s>score){best=plan;score=s;}
    }
    return best;
  }

  function mergedRules(v){
    const base=(root.FIAS_MAINTENANCE_RULES||[]).map(r=>({...r}));
    const plan=matchManufacturerPlan(v);
    if(!plan) return {rules:base,plan:null};
    const map=new Map(base.map(r=>[r.id,r]));
    (plan.rules||[]).forEach(override=>{
      const current=map.get(override.id)||{id:override.id,label:override.label||override.id,family:override.family||'OTROS'};
      map.set(override.id,{...current,...override,sourceType:'FABRICANTE',sourceLabel:plan.sourceLabel||'Plan oficial del fabricante',sourceUrl:plan.sourceUrl||'',requiresManufacturer:false});
    });
    return {rules:[...map.values()],plan};
  }

  function maintenanceEvidence(v, maintRows, detailRows){
    const id=vehicleId(v), plate=plateOf(v);
    const same=(r)=> (id && clean(r.ID_Activo)===id) || (plate && normalize(r.Placa)===normalize(plate));
    return (maintRows||[]).filter(same).map(r=>{
      const ds=detailsForMaintenance(r,detailRows);
      const classified=C().classifyMaintenance(r,ds);
      return {record:r,details:ds,families:classified.families,text:classified.text,date:maintenanceDate(r),km:maintenanceKm(r)};
    }).sort((a,b)=>{
      const da=P().parseDate(a.date), db=P().parseDate(b.date); return (da?da.getTime():0)-(db?db.getTime():0);
    });
  }

  function lastEvidenceForFamily(evidence,family){
    const matches=(evidence||[]).filter(e=>e.families.includes(family));
    return matches.length?matches[matches.length-1]:null;
  }

  function serviceProjection(rule,last,currentKm,usage,now=new Date()){
    const hasEvidence=!!last;
    if(rule.requiresManufacturer && rule.sourceType!=='FABRICANTE'){
      return {status:'unknown',nextKm:null,dueDate:null,kmRemaining:null,daysRemaining:null,hasEvidence,reason:'Requiere especificación verificable del fabricante antes de proyectar el reemplazo.'};
    }
    if(!hasEvidence){
      return {status:'unknown',nextKm:null,dueDate:null,kmRemaining:null,daysRemaining:null,hasEvidence:false,reason:'No existe antecedente verificable en el historial sincronizado.'};
    }
    const lastKm=P().num(last.km)||null;
    const lastDate=P().parseDate(last.date);
    const nextKm=(rule.intervalKm && lastKm!==null) ? lastKm+Number(rule.intervalKm) : null;
    const dueByTime=(rule.intervalMonths && lastDate) ? P().addMonths(lastDate,Number(rule.intervalMonths)) : null;
    const dueByKm=(nextKm!==null && usage.kmDay>0) ? P().projectDate(currentKm,nextKm,usage.kmDay,now) : null;
    const dueDate=P().earliestDate(dueByKm,dueByTime);
    const kmRemaining=nextKm!==null ? nextKm-currentKm : null;
    const daysRemaining=dueDate ? Math.ceil((dueDate-now)/P().MS_DAY) : null;
    const status=P().statusFor({
      kmRemaining:Number.isFinite(kmRemaining)?kmRemaining:NaN,
      daysRemaining:Number.isFinite(daysRemaining)?daysRemaining:NaN,
      hasEvidence:true,requiresManufacturer:false,
      upcomingKm:Number(rule.upcomingKm||1500),upcomingDays:Number(rule.upcomingDays||45)
    });
    const reason = status==='overdue'
      ? `Superó ${kmRemaining!==null&&kmRemaining<0?Math.abs(Math.round(kmRemaining))+' km':''}${kmRemaining!==null&&kmRemaining<0&&daysRemaining!==null&&daysRemaining<0?' y ':''}${daysRemaining!==null&&daysRemaining<0?Math.abs(daysRemaining)+' días':''}.`
      : status==='upcoming'
      ? `Próximo: ${kmRemaining!==null?Math.max(0,Math.round(kmRemaining))+' km':''}${kmRemaining!==null&&daysRemaining!==null?' / ':''}${daysRemaining!==null?Math.max(0,daysRemaining)+' días':''}.`
      : status==='programmed' ? 'Intervención dentro del horizonte de planificación.' : 'Sin alerta inmediata con la regla aplicable.';
    return {status,nextKm,dueDate,kmRemaining,daysRemaining,hasEvidence:true,reason};
  }

  function recurrenceAnalysis(evidence,now=new Date()){
    const cutoff=new Date(now.getTime()-365*P().MS_DAY);
    const counts={};
    (evidence||[]).forEach(e=>{
      const d=P().parseDate(e.date); if(!d||d<cutoff) return;
      e.families.forEach(f=>counts[f]=(counts[f]||0)+1);
    });
    const labels={FRENOS:'Frenos',NEUMATICOS:'Neumáticos',ALINEACION_BALANCEO:'Alineación/balanceo',BATERIA:'Batería',TRANSMISION:'Transmisión',REFRIGERANTE:'Refrigeración'};
    return Object.entries(counts).filter(([f,c])=>c>=3 && labels[f]).map(([family,count])=>({family,count,label:labels[family],windowDays:365}));
  }

  function costTrend(history,now=new Date()){
    const start12=new Date(now.getTime()-365*P().MS_DAY), start24=new Date(now.getTime()-730*P().MS_DAY);
    let recent=0, previous=0, nRecent=0, nPrevious=0;
    (history||[]).filter(h=>!h.invoiceOnly).forEach(h=>{
      const d=P().parseDate(h.date); if(!d) return;
      if(d>=start12){recent+=P().num(h.cost);nRecent++;}
      else if(d>=start24){previous+=P().num(h.cost);nPrevious++;}
    });
    const hasBasis=nRecent>0&&nPrevious>0&&previous>0;
    return {recent,previous,nRecent,nPrevious,hasBasis,changePct:hasBasis?((recent-previous)/previous)*100:0};
  }

  function analyzeVehicle(v,snapshot,now=new Date()){
    const maintRows=getRows(snapshot,'maintenance');
    const detailRows=getRows(snapshot,'maintenanceDetail');
    const invoiceRows=getRows(snapshot,'invoices');
    const history=historyForVehicle(v,maintRows,invoiceRows);
    const km=currentKm(v,history);
    const usage=P().usageRate(history);
    const evidence=maintenanceEvidence(v,maintRows,detailRows);
    const {rules,plan}=mergedRules(v);
    const services=rules.map(rule=>{
      const last=lastEvidenceForFamily(evidence,rule.family);
      const projection=serviceProjection(rule,last,km,usage,now);
      let confidence=0.45;
      if(rule.sourceType==='FABRICANTE') confidence+=.3;
      else if(rule.sourceType==='FIAS_REFERENCIAL') confidence+=.12;
      if(last) confidence+=.12;
      if(usage.confidence==='alta') confidence+=.08; else if(usage.confidence==='media') confidence+=.04;
      confidence=Math.min(.98,confidence);
      return {...rule,...projection,lastEvidence:last?{date:last.date,km:last.km,id:clean(last.record.ID_Mantenimiento),order:clean(last.record.Orden_Reparacion),invoice:clean(last.record.Factura_Nro)}:null,confidence};
    });
    const statusRank={overdue:5,upcoming:4,programmed:3,unknown:2,ok:1};
    const overall=services.reduce((best,s)=>statusRank[s.status]>statusRank[best]?s.status:best,'ok');
    const maintOnly=history.filter(h=>!h.invoiceOnly);
    const lastMaint=maintOnly.length?maintOnly[maintOnly.length-1]:null;
    return {
      id:vehicleId(v),plate:plateOf(v)||'SIN PLACA',make:makeOf(v),model:modelOf(v),year:yearOf(v),engine:engineOf(v),raw:v,
      currentKm:km,usage,lastMaintenance:lastMaint,services,overall,
      recurrences:recurrenceAnalysis(evidence,now),costTrend:costTrend(history,now),manufacturerPlan:plan,
      maintenanceCount:maintOnly.length,totalCost:maintOnly.reduce((s,h)=>s+P().num(h.cost),0)
    };
  }

  function analyzeSnapshot(snapshot,now=new Date()){
    const vehicles=getRows(snapshot,'vehicles');
    const analyses=(vehicles||[]).filter(v=>plateOf(v)||vehicleId(v)).map(v=>analyzeVehicle(v,snapshot,now));
    const alerts=root.FIAS_Alerts?.buildAlerts(analyses)||[];
    const counts=root.FIAS_Alerts?.summary(analyses)||{};
    return {generatedAt:new Date(),vehicles:analyses,alerts,counts};
  }

  root.FIAS_MaintenanceEngine = Object.freeze({analyzeSnapshot,analyzeVehicle,getRows,matchManufacturerPlan});
})(globalThis);
