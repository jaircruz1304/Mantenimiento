(function(root){
  'use strict';
  let lastSignature='';

  function snapshot(){ try{return root.FIAS_CORE_BRIDGE?.snapshot?.()||null;}catch(e){console.warn('FIAS bridge',e);return null;} }
  function shellPolish(){
    const h=document.querySelector('.page-title h2'); if(h) h.textContent='Gestión Vehicular FIAS';
    const brandH=document.querySelector('.brand h1'); if(brandH) brandH.textContent='Gestión Vehicular FIAS';
    const brandS=document.querySelector('.brand small'); if(brandS) brandS.textContent='Mantenimiento · Control · Trazabilidad';
    const navNames={executive:'Resumen',maintenance:'Mantenimientos',fleet:'Vehículos',integrity:'Integridad',ocr:'OCR',assistant:'Análisis',admin:'Bitácora'};
    Object.entries(navNames).forEach(([m,n])=>{const b=document.querySelector(`[data-module="${m}"]`);if(b){const i=b.querySelector('i')?.outerHTML||'';b.innerHTML=`${i} ${n}`;}});
  }
  function signature(s){
    if(!s) return '';
    const tables=s.tableNames||{};
    const counts=Object.keys(tables).map(k=>(s.rows?.[tables[k]]||[]).length).join('|');
    return `${s.connected}|${s.lastSync}|${s.account?.username||''}|${counts}`;
  }
  function recompute(){
    const s=snapshot();
    root.FIAS_Permissions?.apply();
    if(!s || !s.connected) return;
    const sig=signature(s); if(sig===lastSignature) return;
    lastSignature=sig;
    try{
      const a=root.FIAS_MaintenanceEngine?.analyzeSnapshot(s);
      root.FIAS_PreventiveDashboard?.update(a);
    }catch(err){ console.error('Motor preventivo FIAS',err); }
  }
  function init(){
    shellPolish();
    root.FIAS_PreventiveDashboard?.injectNav();
    root.FIAS_PreventiveDashboard?.injectModule();
    root.FIAS_VehicleProfile?.ensureModal();
    root.FIAS_Permissions?.apply();
    recompute();
    const last=document.getElementById('lastSync');
    if(last) new MutationObserver(recompute).observe(last,{childList:true,characterData:true,subtree:true});
    const gate=document.getElementById('authGate');
    if(gate) new MutationObserver(()=>{root.FIAS_Permissions?.apply();recompute();}).observe(gate,{attributes:true,attributeFilter:['class']});
    // Fallback liviano: detecta cambios de sesión/carga sin intervenir en el núcleo.
    setInterval(recompute,5000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})(globalThis);
