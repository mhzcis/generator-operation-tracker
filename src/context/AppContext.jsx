import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import { v4 as uuid } from 'uuid';
import { loadData,saveData } from '../services/storageService';
import { downloadBackup,parseBackup } from '../services/backupService';
import { dayName,isoNow } from '../utils/dates';
import { generatorLogs,latestLog } from '../utils/calculations';
import { validateGenerator,validateLog } from '../utils/validators';
const C=createContext(); export const useApp=()=>useContext(C);
export function AppProvider({children}){const [data,setData]=useState(loadData);const [notice,setNotice]=useState(null);useEffect(()=>saveData(data),[data]);
 const commit=(next,msg,backup=true)=>{setData(next);if(backup)downloadBackup(next);setNotice({type:'success',text:msg})};
 const addGenerator=form=>{const e=validateGenerator(form,data.generators);if(Object.keys(e).length)return e;const now=isoNow();commit({...data,generators:[...data.generators,{...form,id:uuid(),createdAt:now,updatedAt:now}]},'تمت إضافة المولد');return {}};
 const updateGenerator=form=>{const e=validateGenerator(form,data.generators);if(Object.keys(e).length)return e;commit({...data,generators:data.generators.map(x=>x.id===form.id?{...x,...form,updatedAt:isoNow()}:x)},'تم تحديث المولد');return {}};
 const saveLog=form=>{const gl=generatorLogs(data.logs,form.generatorId),editing=!!form.id,last=gl[0];if(editing&&last?.id!==form.id)return {general:'لا يمكن تعديل سوى آخر سجل للمولد'};
   const e=validateLog(form,data.logs);if(Object.keys(e).length)return e;
   const normalized={...form,day:dayName(form.date),previousReading:Number(form.previousReading),currentReading:Number(form.currentReading),operatingHours:form.recordType==='meterReset'?0:Number(form.currentReading)-Number(form.previousReading)};const now=isoNow();let logs;
   if(editing)logs=data.logs.map(x=>x.id===form.id?{...x,...normalized,edited:true,updatedAt:now}:x);else logs=[...data.logs,{...normalized,id:uuid(),createdAt:now,updatedAt:now,edited:false}];commit({...data,logs},editing?'تم تحديث السجل':'تم حفظ السجل');return {id:editing?form.id:logs.at(-1).id};};
 const deleteLog=id=>{const target=data.logs.find(x=>x.id===id);if(!target)return false;if(latestLog(data.logs,target.generatorId)?.id!==id){setNotice({type:'error',text:'لا يمكن حذف سوى آخر سجل للمولد'});return false}commit({...data,logs:data.logs.filter(x=>x.id!==id)},'تم حذف السجل');return true};
 const restore=async file=>{try{downloadBackup(data);const next=await parseBackup(file);setData(next);saveData(next);setNotice({type:'success',text:'تمت استعادة النسخة الاحتياطية بنجاح'})}catch(e){setNotice({type:'error',text:e.message})}};
 const value=useMemo(()=>({data,notice,setNotice,addGenerator,updateGenerator,saveLog,deleteLog,restore,manualBackup:()=>downloadBackup(data)}),[data,notice]);return <C.Provider value={value}>{children}</C.Provider>}
