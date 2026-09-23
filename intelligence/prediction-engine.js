(function(root){
  'use strict';
  const MS_DAY = 86400000;
  const MONTH_DAYS = 30.4375;

  function num(v){
    if(v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g,''));
    return Number.isFinite(n) ? n : 0;
  }
  function parseDate(v){
    if(!v) return null;
    if(v instanceof Date && !isNaN(v)) return v;
    const s = String(v).trim();
    let d = new Date(s);
    if(!isNaN(d)) return d;
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m){ d = new Date(Number(m[3]),Number(m[2])-1,Number(m[1])); return isNaN(d)?null:d; }
    return null;
  }
  function dateISO(d){ return d ? d.toISOString().slice(0,10) : ''; }
  function addMonths(date, months){
    if(!date || !Number.isFinite(months)) return null;
    const d = new Date(date); d.setMonth(d.getMonth()+months); return d;
  }
  function daysBetween(a,b){
    const da=parseDate(a), db=parseDate(b); if(!da||!db) return null;
    return Math.round((db-da)/MS_DAY);
  }
  function median(arr){
    const a=arr.filter(Number.isFinite).sort((x,y)=>x-y); if(!a.length) return 0;
    const mid=Math.floor(a.length/2); return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;
  }
  function usageRate(history){
    const points=(history||[]).map(r=>({date:parseDate(r.date),km:num(r.km)}))
      .filter(p=>p.date&&p.km>0).sort((a,b)=>a.date-b.date);
    const dedup=[];
    for(const p of points){
      const last=dedup[dedup.length-1];
      if(last && dateISO(last.date)===dateISO(p.date)) last.km=Math.max(last.km,p.km); else dedup.push({...p});
    }
    const intervals=[];
    for(let i=1;i<dedup.length;i++){
      const dd=(dedup[i].date-dedup[i-1].date)/MS_DAY;
      const dk=dedup[i].km-dedup[i-1].km;
      if(dd>=7 && dk>0 && dk/dd<1000) intervals.push(dk/dd);
    }
    const recent=intervals.slice(-6);
    const kmDay=median(recent);
    return {kmDay,kmMonth:kmDay*MONTH_DAYS,points:dedup.length,confidence:recent.length>=3?'alta':recent.length>=1?'media':'baja'};
  }
  function earliestDate(a,b){
    if(a&&b) return a<b?a:b; return a||b||null;
  }
  function projectDate(currentKm,targetKm,kmDay,fromDate=new Date()){
    const rem=targetKm-currentKm;
    if(rem<=0) return new Date(fromDate);
    if(!kmDay||kmDay<=0) return null;
    return new Date(fromDate.getTime()+Math.ceil(rem/kmDay)*MS_DAY);
  }
  function statusFor({kmRemaining,daysRemaining,hasEvidence,requiresManufacturer,upcomingKm=1500,upcomingDays=45}){
    if(requiresManufacturer) return 'unknown';
    if(!hasEvidence) return 'unknown';
    const kmKnown=Number.isFinite(kmRemaining);
    const dayKnown=Number.isFinite(daysRemaining);
    if((kmKnown&&kmRemaining<=0)||(dayKnown&&daysRemaining<=0)) return 'overdue';
    if((kmKnown&&kmRemaining<=upcomingKm)||(dayKnown&&daysRemaining<=upcomingDays)) return 'upcoming';
    if((kmKnown&&kmRemaining<=Math.max(upcomingKm*2,3000))||(dayKnown&&daysRemaining<=Math.max(upcomingDays*2,90))) return 'programmed';
    return 'ok';
  }

  root.FIAS_Prediction = Object.freeze({num,parseDate,dateISO,addMonths,daysBetween,median,usageRate,projectDate,earliestDate,statusFor,MS_DAY});
})(globalThis);
