import { currentMonth, todayISO } from './dates';
export const sortLogs = logs => [...logs].sort((a,b)=> b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
export const generatorLogs = (logs,id) => sortLogs(logs.filter(x=>x.generatorId===id));
export const latestLog = (logs,id) => generatorLogs(logs,id)[0] || null;
export const totalHours = logs => logs.reduce((s,x)=>s+Number(x.operatingHours||0),0);
export const dashboardStats = (generators,logs) => {
 const totals=generators.map(g=>({g,h:totalHours(logs.filter(x=>x.generatorId===g.id))})).sort((a,b)=>b.h-a.h);
 return { count:generators.length, active:generators.filter(g=>g.status==='active').length, total:totalHours(logs), month:totalHours(logs.filter(x=>x.date.startsWith(currentMonth()))), top:totals[0]?.h?totals[0]:null, today:totalHours(logs.filter(x=>x.date===todayISO())) };
};
export const dailyChart = logs => {
 const map={}; for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10);map[k]=0}
 logs.forEach(x=>{if(x.date in map)map[x.date]+=Number(x.operatingHours||0)}); return Object.entries(map).map(([date,hours])=>({date:date.slice(5),hours}));
};
export const monthlyByGenerator=(generators,logs)=>generators.map(g=>({name:g.name,hours:totalHours(logs.filter(x=>x.generatorId===g.id&&x.date.startsWith(currentMonth())))}));
