(function(root){
  'use strict';
  const fmtInt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('es-EC',{maximumFractionDigits:0}).format(Number(n)):'—';
  const fmtMoney=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n)):'—';
  const fmtDate=d=>d?new Intl.DateTimeFormat('es-EC').format(d instanceof Date?d:new Date(d)):'—';
  const labelStatus={overdue:'Vencido',upcoming:'Próximo',programmed:'Programado',ok:'Al día',unknown:'Sin información'};
  const statusClass=s=>({overdue:'overdue',upcoming:'upcoming',programmed:'programmed',ok:'ok',unknown:'unknown'}[s]||'unknown');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function ensureModal(){
    if(document.getElementById('fiasIntelModal')) return;
    const el=document.createElement('div');
    el.className='intel-modal';el.id='fiasIntelModal';el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="intel-dialog"><div class="intel-head"><div><h3 id="fiasIntelTitle">Ficha inteligente</h3><p id="fiasIntelSubtitle"></p></div><button class="btn btn-sm btn-ghost" id="fiasIntelClose" type="button"><i class="bi bi-x-lg"></i> Cerrar</button></div><div class="intel-body" id="fiasIntelBody"></div><div class="intel-foot"><button class="btn btn-ghost" id="fiasIntelClose2" type="button">Cerrar</button></div></div>';
    document.body.appendChild(el);
    const close=()=>{el.classList.remove('open');el.setAttribute('aria-hidden','true');};
    document.getElementById('fiasIntelClose').onclick=close;
    document.getElementById('fiasIntelClose2').onclick=close;
    el.addEventListener('click',e=>{if(e.target===el)close();});
  }

  function sourceTag(s){
    const fab=s.sourceType==='FABRICANTE';
    return `<span class="source-tag ${fab?'':'reference'}">${fab?'Fabricante':s.sourceType==='VERIFICAR_FABRICANTE'?'Verificar fabricante':'FIAS referencial'}</span>`;
  }

  function open(vehicle){
    ensureModal();
    const modal=document.getElementById('fiasIntelModal');
    document.getElementById('fiasIntelTitle').textContent=`${vehicle.plate} · ${vehicle.make||''} ${vehicle.model||''}`.trim();
    document.getElementById('fiasIntelSubtitle').textContent=vehicle.manufacturerPlan?'Plan oficial de fabricante asociado.':'Análisis derivado del historial FIAS; los intervalos no oficiales se identifican como referenciales.';
    const rows=(vehicle.services||[]).sort((a,b)=>({overdue:0,upcoming:1,programmed:2,unknown:3,ok:4}[a.status]-{overdue:0,upcoming:1,programmed:2,unknown:3,ok:4}[b.status])).map(s=>`<tr>
      <td><strong>${esc(s.label)}</strong><div class="muted">${esc(s.family)}</div></td>
      <td><span class="service-status ${statusClass(s.status)}">${labelStatus[s.status]||s.status}</span></td>
      <td>${s.lastEvidence?`${esc(s.lastEvidence.date||'—')}<div class="muted">${s.lastEvidence.km?fmtInt(s.lastEvidence.km)+' km':'Sin km'}</div>`:'Sin antecedente'}</td>
      <td>${s.nextKm?fmtInt(s.nextKm)+' km':'—'}</td>
      <td>${s.dueDate?fmtDate(s.dueDate):'—'}</td>
      <td>${sourceTag(s)}<div class="confidence-bar" title="Confianza ${Math.round(s.confidence*100)}%"><i style="width:${Math.round(s.confidence*100)}%"></i></div></td>
      <td>${esc(s.reason||'')}</td>
    </tr>`).join('');
    document.getElementById('fiasIntelBody').innerHTML=`
      <div class="intel-overview">
        <div class="vehicle-metric"><span>Kilometraje actual</span><strong>${fmtInt(vehicle.currentKm)} km</strong></div>
        <div class="vehicle-metric"><span>Uso estimado</span><strong>${vehicle.usage.kmMonth?fmtInt(vehicle.usage.kmMonth)+' km/mes':'Sin patrón'}</strong></div>
        <div class="vehicle-metric"><span>Mantenimientos</span><strong>${fmtInt(vehicle.maintenanceCount)}</strong></div>
        <div class="vehicle-metric"><span>Costo acumulado</span><strong>${fmtMoney(vehicle.totalCost)}</strong></div>
        <div class="vehicle-metric"><span>Fuente principal</span><strong>${vehicle.manufacturerPlan?'Fabricante + historial':'Historial + regla FIAS'}</strong></div>
      </div>
      <div class="intel-section"><h4>Plan técnico por componente</h4><div class="table-wrap"><table class="data-table preventive-table"><thead><tr><th>Componente</th><th>Estado</th><th>Último antecedente</th><th>Próximo km</th><th>Fecha estimada</th><th>Fuente / confianza</th><th>Lectura</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      ${vehicle.recurrences?.length?`<div class="intel-section"><h4>Reincidencias detectadas</h4><div class="alert-stack">${vehicle.recurrences.map(r=>`<div class="smart-alert med"><strong>${esc(r.label)}</strong><p>${r.count} intervenciones registradas en los últimos ${r.windowDays} días. Conviene revisar la causa recurrente, no solo el componente.</p></div>`).join('')}</div></div>`:''}
    `;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }

  root.FIAS_VehicleProfile=Object.freeze({open,ensureModal});
})(globalThis);
