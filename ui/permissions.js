(function(root){
  'use strict';
  const ADMIN='jcruzg@fias.org.ec';
  const PROTECTED=[
    '#btnNew','#btnNew2','#btnSaveForm','#btnAddItem','#btnUseOcr','#btnModalNewFromDetail',
    '#ocrInput','label[for="ocrInput"]'
  ];

  function normalizeEmail(v){ return String(v||'').trim().toLowerCase(); }
  function snapshot(){ try{return root.FIAS_CORE_BRIDGE?.snapshot?.()||null;}catch(_){return null;} }
  function accountEmail(){ return normalizeEmail(snapshot()?.account?.username||''); }
  function isAdmin(){ return accountEmail()===ADMIN; }
  function role(){ return isAdmin()?'Administrador':'Consulta'; }

  function ensureRoleCard(){
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar || document.getElementById('fiasRoleCard')) return;
    const card=document.createElement('div');
    card.id='fiasRoleCard';
    card.innerHTML='<div class="role-line"><span>Acceso</span><span id="fiasRoleBadge">Consulta</span></div><strong id="fiasRoleUser">Sin sesión</strong><div class="fias-readonly-note" id="fiasRoleNote">Los permisos se determinan con la cuenta Microsoft 365 autenticada.</div>';
    sidebar.appendChild(card);
  }

  function apply(){
    ensureRoleCard();
    const email=accountEmail();
    const admin=isAdmin();
    PROTECTED.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{
      el.classList.toggle('fias-protected-hidden',!admin);
      if('disabled' in el) el.disabled=!admin;
      el.setAttribute('aria-hidden',!admin?'true':'false');
    }));
    const badge=document.getElementById('fiasRoleBadge');
    const user=document.getElementById('fiasRoleUser');
    const note=document.getElementById('fiasRoleNote');
    if(badge) badge.textContent=admin?'Administrador':'Consulta';
    if(user) user.textContent=email||'Sin sesión';
    if(note) note.textContent=admin?'Edición habilitada para la cuenta administradora.':'Modo de consulta: sin controles de alta o modificación.';
    document.documentElement.dataset.fiasRole=admin?'admin':'readonly';
    return {email,admin,role:admin?'Administrador':'Consulta'};
  }

  // Segunda barrera en UI: intercepta acciones antes que los listeners del núcleo.
  document.addEventListener('click',function(ev){
    if(isAdmin()) return;
    const target=ev.target?.closest?.(PROTECTED.join(','));
    if(!target) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
  },true);
  document.addEventListener('change',function(ev){
    if(isAdmin()) return;
    if(ev.target?.matches?.('#ocrInput')){ ev.preventDefault(); ev.stopImmediatePropagation(); ev.target.value=''; }
  },true);

  root.FIAS_Permissions=Object.freeze({ADMIN,isAdmin,role,accountEmail,apply});
})(globalThis);
