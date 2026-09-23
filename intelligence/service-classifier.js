(function(root){
  'use strict';

  const normalize = (value) => String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  const FAMILY_PATTERNS = {
    LUBRICACION:[/aceite.*motor/,/cambio.*aceite/,/lubricante.*motor/,/10w\s?30/,/15w\s?40/,/5w\s?30/,/0w\s?20/],
    FILTRO_ACEITE:[/filtro.*aceite/],
    FILTRO_AIRE:[/filtro.*aire(?!.*cabina)/,/elemento.*aire/],
    FILTRO_CABINA:[/filtro.*cabina/,/filtro.*polen/,/filtro.*habitaculo/],
    FILTRO_COMBUSTIBLE:[/filtro.*combustible/,/filtro.*diesel/,/filtro.*gasolina/],
    FRENOS:[/freno/,/pastill/,/disco.*freno/,/zapata/,/limpifreno/],
    LIQUIDO_FRENOS:[/liquido.*freno/],
    NEUMATICOS:[/llanta/,/neumatic/,/rotacion.*llanta/,/enllantaje/],
    ALINEACION_BALANCEO:[/alineacion/,/balanceo/,/camber/,/caster/],
    REFRIGERANTE:[/refrigerante/,/anticongelante/,/coolant/],
    TRANSMISION:[/aceite.*transmision/,/fluido.*transmision/,/aceite.*caja/,/\batf\b/],
    BATERIA:[/bateria/,/alternador/,/sistema.*carga/],
    DISTRIBUCION:[/correa.*distribucion/,/cadena.*distribucion/,/kit.*distribucion/],
    SERVICIO_GENERAL:[/mantenimiento.*preventivo/,/\bpreventivo\b/,/servicio.*general/,/mantenimiento.*kilometraje/,/revision.*general/]
  };

  function classifyText(text){
    const n = normalize(text);
    const families = new Set();
    Object.entries(FAMILY_PATTERNS).forEach(([family,patterns])=>{
      if(patterns.some(rx=>rx.test(n))) families.add(family);
    });
    // Si se identifica líquido de frenos, no se elimina FRENOS: ambos son útiles.
    return [...families];
  }

  function recordText(record, detailRows=[]){
    const base = [
      record.Tipo_Mantenimiento, record.Categoria, record.Ingreso_Observacion,
      record.Cierre_Observacion, record.Observacion_Control, record.Agencia,
      record.Fuente_Principal
    ].filter(Boolean).join(' | ');
    const detail = (detailRows||[]).map(d=>[
      d.Tipo_Item,d.Descripcion,d.Categoria_Item,d.Observaciones,d.Fuente
    ].filter(Boolean).join(' ')).join(' | ');
    return `${base} | ${detail}`;
  }

  function classifyMaintenance(record, detailRows=[]){
    const text = recordText(record, detailRows);
    return {text, normalized:normalize(text), families:classifyText(text)};
  }

  root.FIAS_ServiceClassifier = Object.freeze({normalize,classifyText,classifyMaintenance,recordText});
})(globalThis);
