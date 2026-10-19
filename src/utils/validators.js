import { niceDate, todayISO } from './dates';
import { previousLog } from './calculations';
export const normalizeNumber=v=>String(v??'').trim().toLowerCase();
export function validateGenerator(g, generators){
 const e={}; if(!g.number.trim())e.number='رقم المولد مطلوب'; if(!g.name.trim())e.name='اسم المولد مطلوب'; if(!g.location.trim())e.location='الموقع مطلوب';
 if(generators.some(x=>x.id!==g.id&&normalizeNumber(x.number)===normalizeNumber(g.number)))e.number='رقم المولد مستخدم مسبقًا';
 if(g.capacity!=='' && (!Number.isFinite(Number(g.capacity))||Number(g.capacity)<0))e.capacity='القدرة يجب أن تكون رقمًا غير سالب'; return e;
}
export function validateLog(log, logs){
 const e={}; if(!log.generatorId)e.generatorId='اختر المولد'; if(!log.date)e.date='التاريخ مطلوب'; else if(log.date>todayISO())e.date='لا يسمح بتاريخ مستقبلي';
 if(logs.some(x=>x.id!==log.id&&x.generatorId===log.generatorId&&x.date===log.date))e.date='يوجد سجل لهذا المولد في التاريخ نفسه';
 const prev=log.generatorId?previousLog(logs,log.generatorId,log.id):null;
 if(prev&&!log.id&&prev.date>=todayISO())e.date='يوجد سجل لهذا المولد بتاريخ اليوم، ولا يمكن إضافة سجل آخر قبل اليوم التالي';
 else if(prev&&log.date&&!e.date&&log.date<=prev.date)e.date=`يجب أن يكون التاريخ بعد ${niceDate(prev.date)}، تاريخ آخر سجل سابق لهذا المولد`;
 for(const k of ['previousReading','currentReading']) if(log[k]===''||!Number.isFinite(Number(log[k]))||Number(log[k])<0)e[k]='أدخل رقمًا غير سالب';
 if(log.recordType==='daily'&&Number(log.currentReading)<Number(log.previousReading))e.currentReading='القراءة الحالية لا تقل عن السابقة في السجل اليومي';
 if((log.notes||'').length>500)e.notes='الحد الأقصى 500 حرف'; return e;
}
