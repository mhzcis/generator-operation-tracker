import * as XLSX from 'xlsx';
import { stamp } from '../utils/dates';
const labels={date:'التاريخ',day:'اليوم',generatorNumber:'رقم المولد',generatorName:'اسم المولد',location:'الموقع',recordTypeLabel:'نوع السجل',previousReading:'القراءة السابقة',currentReading:'القراءة الحالية',operatingHours:'ساعات التشغيل',notes:'الملاحظات'};
export const enrich=(logs,generators)=>logs.map(x=>{const g=generators.find(y=>y.id===x.generatorId)||{};return {...x,generatorNumber:g.number||'',generatorName:g.name||'',location:g.location||'',recordTypeLabel:x.recordType==='daily'?'سجل يومي':'تغيير عداد'}});
const rows=(data,columns)=>data.map(r=>Object.fromEntries(columns.map(c=>[labels[c],r[c]??''])));
export function exportExcel(data,columns,title){const ws=XLSX.utils.json_to_sheet(rows(data,columns)); ws['!cols']=columns.map(c=>({wch:Math.max(14,labels[c].length+4)}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'التقرير');XLSX.writeFile(wb,`${title}-${stamp()}.xlsx`)}
export function exportCSV(data,columns,title){const ws=XLSX.utils.json_to_sheet(rows(data,columns));const csv='\ufeff'+XLSX.utils.sheet_to_csv(ws);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`${title}-${stamp()}.csv`;a.click();URL.revokeObjectURL(a.href)}
export const reportLabels=labels;
