import { stamp, isoNow, dayName, isValidISODate, todayISO } from '../utils/dates';
import { normalizeNumber } from '../utils/validators';
import { normalizeDefaultGenerator } from '../utils/generators';
// يعيد true عند إطلاق التنزيل فعليًا، وfalse إذا تعذر ذلك. لا يمكن للمتصفح تأكيد حفظ الملف على القرص.
const download=(text,name,type='application/json')=>{try{if(typeof URL.createObjectURL!=='function')return false;const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');if(!('download' in a))return false;a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true}catch{return false}};
export const downloadBackup=data=>download(JSON.stringify({...data,meta:{...data.meta,lastBackupAt:isoNow()},exportedAt:isoNow()},null,2),`generator-backup-${stamp()}.json`);
const RECORD_TYPES=['daily','meterReset'];
const isReading=v=>v!==''&&v!==null&&typeof v!=='boolean'&&Number.isFinite(Number(v));
const fail=text=>{throw new Error(`تعذرت الاستعادة: ${text}. لم يتم تعديل البيانات الحالية.`)};
// يتحقق من بنية النسخة الاحتياطية ويعيد بيانات مُطبَّعة، أو يرمي خطأ بسبب الرفض دون أي أثر جانبي.
// سياسة ساعات التشغيل: تُعاد حسابها دائمًا من القراءات (السجل اليومي = الحالية - السابقة، تغيير العداد = صفر).
export const validateBackup=(x,today=todayISO())=>{
 if(!x||typeof x!=='object'||Array.isArray(x))fail('بنية الملف غير صالحة');
 if(x.version!=='1.0')fail(`إصدار النسخة الاحتياطية «${x.version??'غير محدد'}» غير مدعوم`);
 if(!Array.isArray(x.generators)||!Array.isArray(x.logs))fail('قائمتا المولدات والسجلات مفقودتان أو غير صالحتين');
 const ids=new Set(),numbers=new Set();
 x.generators.forEach((g,i)=>{const n=i+1;
  if(!g||typeof g!=='object'||typeof g.id!=='string'||!g.id)fail(`المولد رقم ${n} لا يحتوي معرّفًا صالحًا`);
  if(ids.has(g.id))fail(`معرّف المولد رقم ${n} مكرر`);
  if(!normalizeNumber(g.number))fail(`المولد رقم ${n} بلا رقم مولد`);
  if(numbers.has(normalizeNumber(g.number)))fail(`رقم المولد «${String(g.number).trim()}» مكرر`);
  if(!['active','inactive'].includes(g.status))fail(`حالة المولد «${g.number}» غير صالحة`);
  ids.add(g.id);numbers.add(normalizeNumber(g.number));
 });
 const logIds=new Set(),days=new Set();
 const logs=x.logs.map((l,i)=>{const n=i+1;
  if(!l||typeof l!=='object'||typeof l.id!=='string'||!l.id)fail(`السجل رقم ${n} لا يحتوي معرّفًا صالحًا`);
  if(logIds.has(l.id))fail(`معرّف السجل رقم ${n} مكرر`);logIds.add(l.id);
  if(!ids.has(l.generatorId))fail(`السجل رقم ${n} مرتبط بمولد غير موجود`);
  if(!isValidISODate(l.date))fail(`تاريخ السجل رقم ${n} غير صالح`);
  if(l.date>today)fail(`السجل رقم ${n} يحمل تاريخًا مستقبليًا (${l.date})`);
  if(days.has(`${l.generatorId}|${l.date}`))fail(`يوجد أكثر من سجل للمولد نفسه في تاريخ ${l.date}`);days.add(`${l.generatorId}|${l.date}`);
  if(!RECORD_TYPES.includes(l.recordType))fail(`نوع السجل رقم ${n} غير صالح`);
  if(!isReading(l.previousReading)||!isReading(l.currentReading))fail(`قراءات السجل رقم ${n} ليست أرقامًا صالحة`);
  const previousReading=Number(l.previousReading),currentReading=Number(l.currentReading);
  if(previousReading<0||currentReading<0)fail(`السجل رقم ${n} يحتوي قراءة سالبة`);
  if(l.recordType==='daily'&&currentReading<previousReading)fail(`القراءة الحالية في السجل اليومي رقم ${n} أقل من السابقة`);
  if(typeof l.createdAt!=='string'||!l.createdAt)fail(`السجل رقم ${n} بلا تاريخ إنشاء`);
  return {...l,day:dayName(l.date),previousReading,currentReading,operatingHours:l.recordType==='meterReset'?0:currentReading-previousReading};
 });
 // التسلسل الزمني لكل مولد: السجل المُنشأ لاحقًا يجب أن يحمل تاريخًا أحدث، لأن إضافة سجل بتاريخ سابق ممنوعة.
 const byGenerator={};logs.forEach(l=>(byGenerator[l.generatorId]??=[]).push(l));
 Object.values(byGenerator).forEach(list=>{const sorted=[...list].sort((a,b)=>a.date.localeCompare(b.date));sorted.forEach((l,i)=>{if(i&&l.createdAt<sorted[i-1].createdAt)fail(`تسلسل سجلات المولد غير صحيح: سجل ${l.date} أُنشئ قبل سجل أقدم منه تاريخًا (${sorted[i-1].date})`)})});
 return {version:'1.0',generators:normalizeDefaultGenerator(x.generators),logs,meta:x.meta&&typeof x.meta==='object'?x.meta:{}};
};
export const parseBackup=async file=>{let x;try{x=JSON.parse(await file.text())}catch{fail('الملف تالف أو ليس ملف JSON صالحًا')}return validateBackup(x)};
// الاستعادة: نسخة أمان من البيانات الحالية أولًا، ثم التحقق الكامل، ثم الاستبدال فقط عند نجاح كل شيء.
export const restoreBackup=async(file,current,apply,backup=downloadBackup)=>{if(!backup(current))fail('تعذر بدء تنزيل نسخة الأمان من البيانات الحالية');const next=await parseBackup(file);apply(next);return next};
// المسح الشامل: كلمة التأكيد المطلوبة، ثم نسخة أمان أولًا، ولا يُمسح شيء إذا تعذر بدء تنزيلها.
export const WIPE_CONFIRM_WORD='مسح';
export const isWipeConfirmed=text=>String(text??'').trim()===WIPE_CONFIRM_WORD;
export const wipeAllData=(current,clear,backup=downloadBackup)=>{if(!backup(current))throw new Error('تعذر بدء تنزيل نسخة الأمان، لذلك لم يُمسح أي شيء. اسمح بالتنزيلات لهذا الموقع ثم أعد المحاولة.');clear();return true};
