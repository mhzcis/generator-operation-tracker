import { stamp, isoNow } from '../utils/dates';
const download=(text,name,type='application/json')=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
export const downloadBackup=data=>download(JSON.stringify({...data,meta:{...data.meta,lastBackupAt:isoNow()},exportedAt:isoNow()},null,2),`generator-backup-${stamp()}.json`);
export const parseBackup=async file=>{const x=JSON.parse(await file.text());if(x.version!=='1.0'||!Array.isArray(x.generators)||!Array.isArray(x.logs))throw new Error('ملف النسخة الاحتياطية غير صالح أو غير متوافق');return {version:'1.0',generators:x.generators,logs:x.logs,meta:x.meta||{}}};
