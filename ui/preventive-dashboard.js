(function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtInt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('es-EC',{maximumFractionDigits:0}).format(Number(n)):'—';
  const fmtMoney=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)):'—';
  const fmtDate=d=>d?new Intl.DateTimeFormat('es-EC').format(d instanceof Date?d:new Date(d)):'—';
  const statusLabel={overdue:'Vencido',upcoming:'Próximo',programmed:'Programado',ok:'Al día',unknown:'Sin información'};
  const rank={overdue:0,upcoming:1,programmed:2,unknown:3,ok:4};
  let analysis=null;

  function injectNav(){
    if(document.querySelector('[data-module="preventive"]')) return;
    const fleet=document.querySelector('[data-module="fleet"]');
    if(!fleet) return;
    const btn=document.createElement('button');
    btn.className='nav-button';btn.dataset.module='preventive';
    btn.innerHTML='<i class="bi bi-calendar2-check"></i> Plan preventivo';
    fleet.insertAdjacentElement('afterend',btn);
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.nav-button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.module').forEach(m=>m.classList.remove('active'));
      document.getElementById('preventive')?.classList.add('active');
      render();
    });
  }

  function injectModule(){
    if(document.getElementById('preventive')) return;
    const integrity=document.getElementById('integrity');
    if(!integrity) return;
    const sec=document.createElement('section');
    sec.id='preventive';sec.className='module';
    sec.innerHTML=`
      <div class="preventive-hero">
        <div><h3>Plan preventivo inteligente de la flota</h3><p>Analiza kilometraje, historial de intervenciones, trabajos ejecutados, ritmo de uso y reglas técnicas para anticipar mantenimientos. Las reglas de fabricante solo se muestran cuando existe una fuente oficial configurada.</p></div>
        <span class="preventive-source"><i class="bi bi-shield-check"></i> Núcleo SharePoint preservado</span>
      </div>
      <div class="preventive-kpis" id="preventiveKpis"></div>
      <div class="card" style="margin-bottom:12px"><div class="card-head"><div><h3>Prioridades de atención</h3><p>Alertas ordenadas por vencimiento, proximidad, reincidencia y comportamiento de costos.</p></div></div><div class="card-body"><div class="alert-stack" id="preventiveAlerts"></div></div></div>
      <div class="card"><div class="card-head"><div><h3>Agenda preventiva por vehículo</h3><p>Seleccione una unidad para revisar su ficha técnica predictiva.</p></div><button class="btn btn-sm btn-ghost" id="btnPreventiveExport"><i class="bi bi-download"></i> Exportar análisis</button></div>
        <div class="card-body">
          <div class="preventive-controls">
            <div class="field"><label>Buscar vehículo</label><input id="preventiveSearch" placeholder="Placa, marca o modelo"></div>
            <div class="field"><label>Estado</label><select id="preventiveStatus"><option value="">Todos</option><option value="overdue">Vencidos</option><option value="upcoming">Próximos</option><option value="programmed">Programados</option><option value="unknown">Sin información</option><option value="ok">Al día</option></select></div>
            <div class="field"><label>Fuente</label><select id="preventiveSource"><option value="">Todas</option><option value="manufacturer">Fabricante</option><option value="reference">FIAS referencial</option></select></div>
            <div class="field"><label>Ordenar</label><select id="preventiveSort"><option value="priority">Prioridad</option><option value="plate">Placa</option><option value="km">Kilometraje</option></select></div>
          </div>
          <div class="preventive-grid" id="preventiveGrid"></div>
        </div>
      </div>`;
    integrity.insertAdjacentElement('beforebegin',sec);
    ['preventiveSearch','preventiveStatus','preventiveSource','preventiveSort'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderGrid));
    document.getElementById('btnPreventiveExport')?.addEventListener('click',exportCsv);
  }

  function update(newAnalysis){ analysis=newAnalysis||null; render(); renderExecutiveSummary(); }

  function kpi(label,value,sub=''){
    return `<div class="preventive-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<div class="muted" style="font-size:.76rem;margin-top:3px">${esc(sub)}</div>`:''}</div>`;
  }
  function renderKpis(){
    const el=document.getElementById('preventiveKpis'); if(!el) return;
    const c=analysis?.counts||{};
    const vehicles=analysis?.vehicles||[];
    el.innerHTML=[
      kpi('Vehículos',vehicles.length,'unidades analizadas'),
      kpi('Vencidos',c.overdue||0,'intervenciones'),
      kpi('Próximos',c.upcoming||0,'intervenciones'),
      kpi('Programados',c.programmed||0,'intervenciones'),
      kpi('Sin antecedente',c.unknown||0,'requieren validación')
    ].join('');
  }
  function renderAlerts(){
    const el=document.getElementById('preventiveAlerts'); if(!el) return;
    const a=(analysis?.alerts||[]).slice(0,8);
    el.innerHTML=a.length?a.map(x=>`<div class="smart-alert ${x.severity==='high'?'high':x.severity==='med'?'med':'low'}"><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></div>`).join(''):'<div class="preventive-empty">No existen alertas prioritarias con la información disponible.</div>';
  }
  function vehiclePriority(v){ return Math.min(...(v.services||[]).map(s=>rank[s.status]??9),9); }
  function vehicleMatchesSource(v,src){
    if(!src) return true;
    if(src==='manufacturer') return (v.services||[]).some(s=>s.sourceType==='FABRICANTE');
    return (v.services||[]).some(s=>s.sourceType!=='FABRICANTE');
  }
  function renderGrid(){
    const el=document.getElementById('preventiveGrid'); if(!el) return;
    const q=(document.getElementById('preventiveSearch')?.value||'').toLowerCase().trim();
    const st=document.getElementById('preventiveStatus')?.value||'';
    const src=document.getElementById('preventiveSource')?.value||'';
    const sort=document.getElementById('preventiveSort')?.value||'priority';
    let rows=[...(analysis?.vehicles||[])].filter(v=>{
      const text=`${v.plate} ${v.make} ${v.model}`.toLowerCase();
      return (!q||text.includes(q)) && (!st||(v.services||[]).some(s=>s.status===st)) && vehicleMatchesSource(v,src);
    });
    rows.sort((a,b)=> sort==='plate'?a.plate.localeCompare(b.plate):sort==='km'?b.currentKm-a.currentKm:vehiclePriority(a)-vehiclePriority(b));
    el.innerHTML=rows.length?rows.map(v=>{
      const priorities=(v.services||[]).filter(s=>s.status!=='ok').sort((a,b)=>(rank[a.status]??9)-(rank[b.status]??9)).slice(0,7);
      const next=(v.services||[]).filter(s=>['overdue','upcoming','programmed'].includes(s.status)).sort((a,b)=>(rank[a.status]??9)-(rank[b.status]??9))[0];
      return `<article class="vehicle-intel-card">
        <div class="vehicle-intel-head"><div><div class="vehicle-intel-title">${esc(v.plate)} · ${esc([v.make,v.model].filter(Boolean).join(' '))}</div><div class="vehicle-intel-sub">${v.year?esc(v.year):'Año no registrado'}${v.manufacturerPlan?' · Plan de fabricante asociado':' · Regla preventiva FIAS cuando no existe plan oficial'}</div></div><button class="btn btn-sm btn-ghost fias-view-profile" data-plate="${esc(v.plate)}"><i class="bi bi-card-checklist"></i> Ver ficha</button></div>
        <div class="vehicle-metrics">
          <div class="vehicle-metric"><span>Km actual</span><strong>${fmtInt(v.currentKm)}</strong></div>
          <div class="vehicle-metric"><span>Uso estimado</span><strong>${v.usage.kmMonth?fmtInt(v.usage.kmMonth)+' km/mes':'Sin patrón'}</strong></div>
          <div class="vehicle-metric"><span>Último mantenimiento</span><strong>${v.lastMaintenance?.date?esc(v.lastMaintenance.date):'Sin fecha'}</strong></div>
          <div class="vehicle-metric"><span>Próxima prioridad</span><strong>${next?esc(next.label):'Sin alerta'}</strong></div>
          <div class="vehicle-metric"><span>Costo acumulado</span><strong>${fmtMoney(v.totalCost)}</strong></div>
        </div>
        <div class="service-strip">${priorities.length?priorities.map(s=>`<span class="service-status ${s.status}">${esc(statusLabel[s.status])}: ${esc(s.label)}</span>`).join(''):'<span class="service-status ok">Sin alertas inmediatas</span>'}</div>
      </article>`;
    }).join(''):'<div class="preventive-empty">No existen vehículos que coincidan con los filtros seleccionados.</div>';
    el.querySelectorAll('.fias-view-profile').forEach(btn=>btn.addEventListener('click',()=>{
      const v=(analysis?.vehicles||[]).find(x=>x.plate===btn.dataset.plate); if(v) root.FIAS_VehicleProfile?.open(v);
    }));
  }
  function render(){ if(!document.getElementById('preventive')) return; renderKpis();renderAlerts();renderGrid(); }
  function renderExecutiveSummary(){
    const executive=document.getElementById('executive'); if(!executive) return;
    let box=document.getElementById('fiasPreventiveSummary');
    if(!box){ box=document.createElement('div');box.id='fiasPreventiveSummary'; const kpis=document.getElementById('kpis'); if(kpis) kpis.insertAdjacentElement('afterend',box); }
    const c=analysis?.counts||{};
    const high=(analysis?.alerts||[]).filter(a=>a.severity==='high').length;
    box.innerHTML=`<div class="preventive-summary-card"><div><h4><i class="bi bi-calendar2-check"></i> Atención preventiva</h4><p>${c.overdue||0} intervenciones vencidas · ${c.upcoming||0} próximas · ${high} alertas prioritarias.</p></div><button class="btn btn-sm btn-primary" id="btnGoPreventive">Ver plan preventivo</button></div>`;
    document.getElementById('btnGoPreventive')?.addEventListener('click',()=>document.querySelector('[data-module="preventive"]')?.click());
  }
  function exportCsv(){
    if(!analysis) return;
    const lines=[['Placa','Marca','Modelo','Km actual','Servicio','Estado','Ultimo km','Ultima fecha','Proximo km','Fecha estimada','Fuente','Confianza','Lectura']];
    analysis.vehicles.forEach(v=>(v.services||[]).forEach(s=>lines.push([
      v.plate,v.make,v.model,Math.round(v.currentKm||0),s.label,statusLabel[s.status]||s.status,
      s.lastEvidence?.km||'',s.lastEvidence?.date||'',s.nextKm?Math.round(s.nextKm):'',s.dueDate?s.dueDate.toISOString().slice(0,10):'',
      s.sourceType,Math.round((s.confidence||0)*100)+'%',s.reason||''
    ])));
    const csv=lines.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='plan_preventivo_fias.csv';a.click();URL.revokeObjectURL(a.href);
  }

  root.FIAS_PreventiveDashboard=Object.freeze({injectNav,injectModule,update,render});
})(globalThis);
