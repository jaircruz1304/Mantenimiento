/*
  FIAS · Mejoras no invasivas
  -------------------------------------------------------------
  REGLA DE DISEÑO: este archivo NO reemplaza la conexión Microsoft
  Graph/Excel/SharePoint del archivo base. Trabaja únicamente sobre
  el DOM ya renderizado por la aplicación original.
*/
(() => {
  'use strict';

  const ADMIN_EMAIL = 'jcruzg@fias.org.ec';
  const WRITE_CONTROL_IDS = new Set([
    'btnNew','btnNew2','btnSaveForm','btnAddItem','btnUseOcr','btnModalNewFromDetail'
  ]);

  const norm = value => String(value || '').trim().toLowerCase();
  const byId = id => document.getElementById(id);

  function extractEmail(text){
    const match = String(text || '').match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return match ? norm(match[0]) : '';
  }

  function currentEmail(){
    return extractEmail(byId('userName')?.textContent) || extractEmail(byId('sessionChipText')?.textContent);
  }

  function isAuthenticated(){
    const email = currentEmail();
    return !!email;
  }

  function isAdmin(){ return currentEmail() === ADMIN_EMAIL; }

  function notice(message){
    let zone = document.getElementById('fiasSafeToastZone');
    if(!zone){
      zone = document.createElement('div');
      zone.id = 'fiasSafeToastZone';
      Object.assign(zone.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:'99999',display:'grid',gap:'8px'});
      document.body.appendChild(zone);
    }
    const box = document.createElement('div');
    box.textContent = message;
    Object.assign(box.style,{background:'#fff',border:'1px solid #e4e7ec',borderLeft:'4px solid #1f7a38',borderRadius:'12px',boxShadow:'0 12px 30px rgba(16,24,40,.15)',padding:'11px 13px',maxWidth:'360px',fontSize:'.84rem',color:'#344054'});
    zone.appendChild(box);
    setTimeout(()=>box.remove(),4200);
  }

  function ensureRoleBox(){
    const sidebar = document.querySelector('.sidebar');
    if(!sidebar || document.getElementById('fiasRoleBox')) return;
    const box = document.createElement('div');
    box.id = 'fiasRoleBox';
    box.className = 'fias-role-box';
    box.innerHTML = '<div class="fias-role-row"><span class="fias-role-dot"></span><span id="fiasRoleLabel">Sesión institucional</span></div><div id="fiasRoleEmail" class="fias-role-email">Pendiente de autenticación</div>';
    sidebar.appendChild(box);
  }

  function applyRole(){
    ensureRoleBox();
    const email = currentEmail();
    const authenticated = !!email;
    const admin = authenticated && email === ADMIN_EMAIL;
    document.body.classList.toggle('fias-readonly', authenticated && !admin);

    WRITE_CONTROL_IDS.forEach(id => {
      const el = byId(id);
      if(!el) return;
      el.classList.toggle('fias-write-hidden', authenticated && !admin);
      el.setAttribute('aria-hidden', authenticated && !admin ? 'true' : 'false');
      if('disabled' in el) el.disabled = authenticated && !admin;
    });

    const input = byId('ocrInput');
    if(input){
      input.disabled = authenticated && !admin;
      const drop = document.querySelector('label[for="ocrInput"]');
      if(drop) drop.classList.toggle('fias-write-hidden', authenticated && !admin);
    }

    const roleBox = byId('fiasRoleBox');
    const roleLabel = byId('fiasRoleLabel');
    const roleEmail = byId('fiasRoleEmail');
    if(roleBox) roleBox.classList.toggle('admin', admin);
    if(roleLabel) roleLabel.textContent = !authenticated ? 'Sesión institucional' : admin ? 'Administrador' : 'Consulta';
    if(roleEmail) roleEmail.textContent = email || 'Pendiente de autenticación';
  }

  /* Segunda barrera de interfaz: no toca btnSync, login, sesión Excel ni lecturas. */
  document.addEventListener('click', ev => {
    if(!isAuthenticated() || isAdmin()) return;
    const control = ev.target.closest('[id]');
    if(control && WRITE_CONTROL_IDS.has(control.id)){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      notice(`Modo consulta: solo ${ADMIN_EMAIL} puede registrar o modificar información.`);
    }
  }, true);

  document.addEventListener('change', ev => {
    if(ev.target?.id === 'ocrInput' && isAuthenticated() && !isAdmin()){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      try{ ev.target.value = ''; }catch(_){ }
      notice(`Modo consulta: la carga documental está reservada a ${ADMIN_EMAIL}.`);
    }
  }, true);

  function ensureStatusStrip(){
    const main = document.querySelector('main.main');
    const topbar = document.querySelector('.topbar');
    if(!main || !topbar || byId('fiasStatusStrip')) return;
    const strip = document.createElement('div');
    strip.id = 'fiasStatusStrip';
    strip.className = 'fias-status-strip';
    strip.innerHTML = `
      <span class="fias-status-item"><span id="fiasConnLed" class="fias-status-led"></span>Datos <strong id="fiasConnText">Pendiente</strong></span>
      <span class="fias-status-item"><i class="bi bi-person-check"></i>Acceso <strong id="fiasAccessText">Sin sesión</strong></span>
      <span class="fias-status-item"><i class="bi bi-clock-history"></i>Última sincronización <strong id="fiasSyncText">—</strong></span>`;
    topbar.insertAdjacentElement('afterend',strip);
  }

  function syncStatusStrip(){
    ensureStatusStrip();
    const conn = byId('connState')?.textContent?.trim() || 'Pendiente';
    const sync = byId('lastSync')?.textContent?.trim() || byId('sideLastSync')?.textContent?.replace(/^Última sincronización:\s*/i,'') || '—';
    const email = currentEmail();
    const c = byId('fiasConnText'), s = byId('fiasSyncText'), a = byId('fiasAccessText'), led=byId('fiasConnLed');
    if(c) c.textContent = conn;
    if(s) s.textContent = sync;
    if(a) a.textContent = email ? (email === ADMIN_EMAIL ? 'Administrador' : 'Consulta') : 'Sin sesión';
    if(led) led.classList.toggle('ok', /conectado/i.test(conn));
  }

  function simplifyValidationPanel(){
    const body = byId('maintenanceDetailBody');
    if(!body) return;
    [...body.querySelectorAll('.detail-section')].forEach(section => {
      const title = section.querySelector('h4')?.textContent || '';
      if(!/validaciones de control/i.test(title)) return;
      const grid = section.querySelector('.detail-grid');
      if(!grid || grid.dataset.fiasProcessed === '1') return;
      grid.dataset.fiasProcessed='1';
      const cells=[...grid.querySelectorAll('.detail-cell')];
      let issueCount=0;
      cells.forEach(cell => {
        const label=norm(cell.querySelector('span')?.textContent);
        const value=norm(cell.querySelector('strong')?.textContent);
        const normal = value === 'ok' || value === 'no' || value === 'sin_factura' || value === 'sin factura';
        const general = /lectura general/.test(label);
        if(normal || (general && value === 'ok')) cell.style.display='none'; else issueCount += 1;
      });
      if(issueCount === 0){
        grid.innerHTML='<div class="fias-validation-ok"><i class="bi bi-shield-check"></i>Sin observaciones de control. El registro no presenta alertas activas.</div>';
        grid.style.display='block';
      }
    });
  }

  function parseNumber(text){
    const clean=String(text||'').replace(/[^0-9-]/g,'');
    const n=Number(clean); return Number.isFinite(n)?n:0;
  }

  function ensureIntelligencePanel(){
    const fleet=byId('fleet');
    const grid=fleet?.querySelector('.section-grid');
    if(!grid || byId('fiasIntelCard')) return;
    const card=document.createElement('article');
    card.id='fiasIntelCard';
    card.className='span-12 fias-intel-card';
    card.innerHTML=`
      <div class="fias-intel-head">
        <div><h3><i class="bi bi-activity"></i> Agenda preventiva inteligente</h3><p>Consolida la predicción ya calculada por la base real de vehículos y mantenimientos.</p></div>
        <span class="fias-intel-badge"><i class="bi bi-database-check"></i> Fuente: Excel FIAS</span>
      </div>
      <div class="fias-intel-body">
        <div class="fias-intel-metrics">
          <div class="fias-intel-metric"><span>Vehículos analizados</span><strong id="fiasIntelTotal">0</strong></div>
          <div class="fias-intel-metric"><span>Vencidos</span><strong id="fiasIntelDue">0</strong></div>
          <div class="fias-intel-metric"><span>Próximos</span><strong id="fiasIntelNear">0</strong></div>
          <div class="fias-intel-metric"><span>Programados</span><strong id="fiasIntelOk">0</strong></div>
        </div>
        <div id="fiasIntelList" class="fias-intel-list"><div class="muted">Sincronice la base para generar la agenda preventiva.</div></div>
      </div>`;
    grid.appendChild(card);
  }

  function renderIntelligence(){
    ensureIntelligencePanel();
    const tbody=byId('predictionBody');
    if(!tbody) return;
    const rows=[...tbody.querySelectorAll('tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim())).filter(c=>c.length>=6);
    const data=rows.map(c=>({plate:c[0],current:parseNumber(c[1]),next:parseNumber(c[2]),remaining:parseNumber(c[3]),date:c[4],priority:c[5]}));
    const due=data.filter(r=>/vencido/i.test(r.priority));
    const near=data.filter(r=>/próximo|proximo/i.test(r.priority));
    const ok=data.filter(r=>/programado/i.test(r.priority));
    if(byId('fiasIntelTotal')) byId('fiasIntelTotal').textContent=data.length;
    if(byId('fiasIntelDue')) byId('fiasIntelDue').textContent=due.length;
    if(byId('fiasIntelNear')) byId('fiasIntelNear').textContent=near.length;
    if(byId('fiasIntelOk')) byId('fiasIntelOk').textContent=ok.length;
    const list=byId('fiasIntelList');
    if(!list) return;
    if(!data.length){ list.innerHTML='<div class="muted">Sincronice la base para generar la agenda preventiva.</div>'; return; }
    const rank={Vencido:0,'Próximo':1,Proximo:1,Programado:2};
    const sorted=data.slice().sort((a,b)=> (rank[a.priority]??3)-(rank[b.priority]??3) || a.remaining-b.remaining).slice(0,8);
    list.innerHTML=sorted.map(r=>{
      const cls=/vencido/i.test(r.priority)?'bad':/próximo|proximo/i.test(r.priority)?'warn':'ok';
      return `<div class="fias-intel-row"><div><strong>${escapeText(r.plate)}</strong><div class="muted">Actual ${fmt(r.current)} km · objetivo ${fmt(r.next)} km</div></div><span>${escapeText(r.date||'—')}</span><span class="fias-priority ${cls}">${escapeText(r.priority)}</span></div>`;
    }).join('');
  }

  function escapeText(v){ return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }
  function fmt(n){ return Number(n||0).toLocaleString('es-EC'); }

  function refreshEnhancements(){
    applyRole();
    syncStatusStrip();
    simplifyValidationPanel();
    renderIntelligence();
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return; queued=true;
    requestAnimationFrame(()=>{ queued=false; refreshEnhancements(); });
  };

  const observer=new MutationObserver(schedule);
  window.addEventListener('DOMContentLoaded',()=>{
    ensureRoleBox();ensureStatusStrip();ensureIntelligencePanel();refreshEnhancements();
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:false});
  });
})();
