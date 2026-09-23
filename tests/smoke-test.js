const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const required=[
  'index.html','BASE_ORIGINAL_NO_MODIFICAR.html','assets/fias-ui.css',
  'config/maintenance-rules.js','config/manufacturer-plans.js',
  'intelligence/service-classifier.js','intelligence/prediction-engine.js','intelligence/alerts-engine.js','intelligence/maintenance-engine.js',
  'ui/permissions.js','ui/vehicle-profile.js','ui/preventive-dashboard.js','ui/app-bootstrap.js'
];
for(const f of required){if(!fs.existsSync(path.join(root,f))) throw new Error('Falta archivo: '+f);}
const base=fs.readFileSync(path.join(root,'BASE_ORIGINAL_NO_MODIFICAR.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const normalizeNL=s=>s.replace(/\r\n/g,'\n');
const hash=s=>crypto.createHash('sha256').update(normalizeNL(s)).digest('hex');
console.log('Base SHA-256:',hash(base));
if(!base.includes("shareTokenOrUrl")||!base.includes("async function syncAll")||!base.includes("async function createSession")) throw new Error('La base no contiene el núcleo esperado.');
if(!index.includes('FIAS_CORE_BRIDGE')) throw new Error('Falta bridge de solo lectura.');
if(!index.includes('./ui/app-bootstrap.js')) throw new Error('Falta bootstrap externo.');
// Comprueba que los fragmentos críticos de conexión siguen idénticos.
function extract(src,start,end){const a=src.indexOf(start);const b=src.indexOf(end,a);if(a<0||b<0)throw new Error('No se pudo extraer '+start);return src.slice(a,b);}
const critical=[
  ["const CONFIG = {","const TABLE_META = ["],
  ["async function setupMsal()","async function login()"],
  ["async function resolveDriveItem()","async function closeWorkbookSession()"],
  ["async function closeWorkbookSession()","async function createSession()"],
  ["async function createSession()","function tableBase(tableName)"],
  ["async function loadTable(tableName)","function normalizeRow(tableName, row)"],
  ["async function syncAll()","function friendlyGraphError"]
];
for(const [a,b] of critical){
  const hb=hash(extract(base,a,b)), hi=hash(extract(index,a,b));
  if(hb!==hi) throw new Error('Se modificó un bloque crítico: '+a);
}
for(const f of required.filter(f=>f.endsWith('.js'))){
  cp.execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});
}
const htmlBeforeScripts=index.slice(0,index.indexOf('<script src="https://cdn.jsdelivr.net/npm/chart.js'));
const ids=[...htmlBeforeScripts.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(dup.length) throw new Error('IDs duplicados en index: '+[...new Set(dup)].join(','));
console.log('Smoke test OK. Núcleo crítico preservado y módulos sintácticamente válidos.');
