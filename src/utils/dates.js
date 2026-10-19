import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
export const dayName = date => date ? format(parseISO(date), 'EEEE', { locale: ar }) : '';
export const niceDate = date => date ? format(parseISO(date), 'dd/MM/yyyy') : '—';
export const stamp = () => format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
export const isoNow = () => new Date().toISOString();
export const currentMonth = () => format(new Date(), 'yyyy-MM');
