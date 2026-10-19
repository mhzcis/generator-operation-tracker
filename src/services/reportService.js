import * as XLSX from 'xlsx';
import { niceDate, stamp } from '../utils/dates';
import { RECORD_TYPES } from '../data/defaultData';
import { sortLogs } from '../utils/calculations';
const labels={date:'التاريخ',day:'اليوم',generatorNumber:'رقم المولد',generatorName:'اسم المولد',location:'الموقع',recordTypeLabel:'نوع السجل',previousReading:'القراءة السابقة',currentReading:'القراءة الحالية',operatingHours:'ساعات التشغيل',notes:'الملاحظات'};
export const enrich=(logs,generators)=>logs.map(x=>{const g=generators.find(y=>y.id===x.generatorId)||{};return {...x,generatorNumber:g.number||'',generatorName:g.name||'',location:g.location||'',recordTypeLabel:x.recordType==='daily'?'سجل يومي':'تغيير عداد'}});
const rows=(data,columns)=>data.map(r=>Object.fromEntries(columns.map(c=>[labels[c],r[c]??''])));
// تقرير Excel منسق عبر ExcelJS، لأن نسخة SheetJS المجانية الحالية لا تكتب أنماط الخلايا ولا تجميد الأجزاء.
const XL={primary:'FF0F766E',dark:'FF115E59',accent:'FFF59E0B',metaFill:'FFECFDF5',zebra:'FFF4F7FB',border:'FFCBD5E1',text:'FF17324D',white:'FFFFFFFF'};
const NUMERIC=['previousReading','currentReading','operatingHours'];
const thin={style:'thin',color:{argb:XL.border}},allBorders={top:thin,left:thin,bottom:thin,right:thin};
const numFmt=v=>Number.isInteger(Number(v))?'#,##0':'#,##0.0#';
const cellValue=(r,c)=>{const v=r[c]??'';if(c==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))}if(NUMERIC.includes(c)&&v!==''&&Number.isFinite(Number(v)))return Number(v);return v};
const displayLength=(r,c)=>c==='date'?10:String(r[c]??'').length;
// خط رسمي متوفر في Excel على Windows وmacOS ويدعم العربية جيدًا، ويُطبق على كل الخلايا.
export const EXCEL_FONT='Times New Roman';
export const EXCEL_SHEET_NAME='تقرير التشغيل';
export const EXCEL_HEADER_ROW=5;
export function buildExcelWorkbook(ExcelJS,data,columns,{filtersText='',createdAt=new Date()}={}){
 const wb=new ExcelJS.Workbook();wb.creator='نظام متابعة تشغيل المولدات';wb.created=createdAt;
 const n=columns.length,H=EXCEL_HEADER_ROW;
 const ws=wb.addWorksheet(EXCEL_SHEET_NAME,{views:[{rightToLeft:true,state:'frozen',xSplit:0,ySplit:H,activeCell:`A${H+1}`}],properties:{defaultRowHeight:20},
  pageSetup:{paperSize:9,orientation:n>6?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,printTitlesRow:`${H}:${H}`,margins:{left:0.4,right:0.4,top:0.6,bottom:0.6,header:0.3,footer:0.3}},
  headerFooter:{oddFooter:'&Cصفحة &P من &N'}});
 const meta=[['تقرير تشغيل المولدات'],[`تاريخ ووقت الإنشاء: ${createdAt.toLocaleString('ar',{dateStyle:'full',timeStyle:'short'})}`],[`عدد النتائج: ${data.length}`],[`الفلاتر المطبقة: ${filtersText||'لا يوجد'}`]];
 meta.forEach(([text],i)=>{const row=ws.getRow(i+1);row.getCell(1).value=text;if(n>1)ws.mergeCells(i+1,1,i+1,n);const cell=row.getCell(1);
  if(i===0){row.height=36;cell.font={name:EXCEL_FONT,size:18,bold:true,color:{argb:XL.white}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL.primary}};cell.alignment={horizontal:'center',vertical:'middle',readingOrder:'rtl'};cell.border={bottom:{style:'medium',color:{argb:XL.accent}}}}
  else{row.height=i===3?Math.max(22,Math.ceil(text.length/Math.max(20,n*14))*18):22;cell.font={name:EXCEL_FONT,size:11,bold:i<3,color:{argb:XL.text}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL.metaFill}};cell.alignment={horizontal:'right',vertical:'middle',wrapText:true,readingOrder:'rtl'}}});
 const head=ws.getRow(H);head.height=28;columns.forEach((c,i)=>{const cell=head.getCell(i+1);cell.value=labels[c];cell.font={name:EXCEL_FONT,size:11,bold:true,color:{argb:XL.white}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL.dark}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true,readingOrder:'rtl'};cell.border={...allBorders,bottom:{style:'medium',color:{argb:XL.accent}}}});
 data.forEach((r,ri)=>{const row=ws.getRow(H+1+ri);columns.forEach((c,i)=>{const cell=row.getCell(i+1),v=cellValue(r,c);cell.value=v;cell.font={name:EXCEL_FONT,size:10,color:{argb:XL.text},bold:c==='operatingHours'};cell.border=allBorders;
  if(ri%2)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:XL.zebra}};
  if(c==='date')cell.numFmt='dd/mm/yyyy';else if(typeof v==='number')cell.numFmt=numFmt(v);
  const right=c==='notes'||c==='generatorName'||c==='location';cell.alignment={vertical:'middle',readingOrder:'rtl',horizontal:right?'right':'center',indent:right?1:0,wrapText:c==='notes'}})});
 columns.forEach((c,i)=>{const longest=Math.max(labels[c].length,...data.map(r=>displayLength(r,c)));ws.getColumn(i+1).width=Math.min(c==='notes'?50:35,Math.max(12,longest+4))});
 ws.autoFilter={from:{row:H,column:1},to:{row:H,column:n}};
 return wb;
}
export async function exportExcel(data,columns,title,filtersText){const{default:ExcelJS}=await import('exceljs');const wb=buildExcelWorkbook(ExcelJS,data,columns,{filtersText});const buffer=await wb.xlsx.writeBuffer();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download=`${title}-${stamp()}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
export function exportCSV(data,columns,title){const ws=XLSX.utils.json_to_sheet(rows(data,columns));const csv='\ufeff'+XLSX.utils.sheet_to_csv(ws);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`${title}-${stamp()}.csv`;a.click();URL.revokeObjectURL(a.href)}
export const reportLabels=labels;
// صياغة عربية مفهومة للفلاتر المطبقة، تستخدمها الطباعة وتقرير Excel.
const filterLabels={q:'بحث شامل',from:'من تاريخ',to:'إلى تاريخ',day:'اليوم',generator:'المولد',type:'نوع السجل',prev:'القراءة السابقة',current:'القراءة الحالية',hours:'ساعات التشغيل'};
export const describeFilters=(filters,generators)=>Object.entries(filters).filter(([k,v])=>filterLabels[k]&&v!==''&&v!=='all'&&v!=null).map(([k,v])=>{let text=v;if(k==='from'||k==='to')text=niceDate(v);else if(k==='type')text=RECORD_TYPES[v]||v;else if(k==='generator'){const g=generators.find(x=>x.id===v);text=g?`${g.number} | ${g.name}`:'مولد غير معروف'}else if(k==='q')text=`«${v}»`;return `${filterLabels[k]}: ${text}`}).join('، ');
// فلاتر صفحة سجل التشغيل (منقولة كما هي من الصفحة)، ونتيجتها هي ما يُعرض ويُصدَّر فقط.
export const filterLogs=(logs,generators,filters)=>sortLogs(logs).filter(x=>{const g=generators.find(y=>y.id===x.generatorId)||{};const hay=[g.number,g.name,x.notes,x.recordType==='daily'?'سجل يومي':'تغيير عداد'].join(' ').toLowerCase();return hay.includes(filters.q.toLowerCase())&&(!filters.from||x.date>=filters.from)&&(!filters.to||x.date<=filters.to)&&(filters.day==='all'||x.day===filters.day)&&(filters.generator==='all'||x.generatorId===filters.generator)&&(filters.type==='all'||x.recordType===filters.type)&&(filters.prev===''||Number(x.previousReading)===Number(filters.prev))&&(filters.current===''||Number(x.currentReading)===Number(filters.current))&&(filters.hours===''||Number(x.operatingHours)===Number(filters.hours))});
