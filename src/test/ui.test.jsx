import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { AppProvider, useApp } from '../context/AppContext';
import { makeTheme } from '../theme';
import OperationLogs from '../pages/OperationLogs';
import { gen, log, memoryStorage } from './fixtures';

const seed = data => { globalThis.localStorage = memoryStorage(); localStorage.setItem('generator-tracker-v1', JSON.stringify({ version: '1.0', meta: {}, ...data })); };
const data = () => ({ generators: [gen('a', { isDefault: true }), gen('b'), gen('c', { status: 'inactive' })], logs: [log('1', 'a', '2026-10-15', { previousReading: 0, currentReading: 50, operatingHours: 50 })] });
const renderAt = url => renderToString(<ThemeProvider theme={makeTheme('light')}><AppProvider><MemoryRouter initialEntries={[url]}><Routes><Route path="/logs" element={<OperationLogs />} /></Routes></MemoryRouter></AppProvider></ThemeProvider>);
const grabApp = () => { let api; const Grab = () => { api = useApp(); return null; }; renderToString(<AppProvider><Grab /></AppProvider>); return api; };
const formSelectValue = html => [...html.matchAll(/class="MuiSelect-nativeInput[^"]*" value="([^"]*)"/g)].map(m => m[1]);

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 19, 12)); });
afterEach(() => { vi.useRealTimers(); delete globalThis.localStorage; });

describe('واجهة سجل التشغيل', () => {
 it('نموذج سجل جديد يختار المولد الافتراضي ويحسب التاريخ والقراءة السابقة من آخر سجل له', () => {
  seed(data());
  const html = renderAt('/logs');
  expect(formSelectValue(html)[0]).toBe('a');
  expect(html).toContain('value="2026-10-16"');
  expect(html).toContain('min="2026-10-16"');
  expect(html).toContain('value="50"');
 });
 it('الانتقال من مولد بلا سجلات يفتح النموذج ويختار المولد بتاريخ اليوم وقراءة سابقة يدوية', () => {
  seed(data());
  const html = renderAt('/logs?generator=b&new=1');
  expect(html).toContain('MuiCollapse-entered');
  expect(formSelectValue(html)[0]).toBe('b');
  expect(html).toContain('value="2026-10-19"');
  expect(html).toContain('أدخل قراءة البداية لأول سجل');
 });
 it('يعطل الحفظ ويعرض رسالة عربية إذا كان أحدث سجل للمولد الافتراضي بتاريخ اليوم', () => {
  seed({ generators: [gen('a', { isDefault: true })], logs: [log('1', 'a', '2026-10-19')] });
  const html = renderAt('/logs');
  expect(html).toContain('لا يمكن إضافة سجل آخر له قبل اليوم التالي');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>حفظ السجل/);
 });
 it('بيانات localStorage القديمة بلا isDefault تعمل دون خطأ ولا يُختار أي مولد افتراضيًا', () => {
  seed({ generators: [gen('a'), gen('b')], logs: [] });
  expect(formSelectValue(renderAt('/logs'))[0]).toBe('');
 });
});

describe('طبقة الخدمة تمنع التحايل على الواجهة', () => {
 it('ترفض تاريخًا سابقًا لأحدث سجل حتى لو أُرسل مباشرة', () => {
  seed(data());
  const r = grabApp().saveLog({ generatorId: 'a', date: '2026-10-10', recordType: 'daily', previousReading: '50', currentReading: '60', notes: '' });
  expect(r.date).toContain('بعد 15/10/2026');
 });
 it('تفرض القراءة السابقة من أحدث سجل وتتجاهل القيمة المرسلة يدويًا', () => {
  seed(data());
  const r = grabApp().saveLog({ generatorId: 'a', date: '2026-10-16', recordType: 'daily', previousReading: '0', currentReading: '20', notes: '' });
  expect(r.currentReading).toBe('القراءة الحالية لا تقل عن السابقة في السجل اليومي');
 });
 it('ترفض تعديل سجل غير الأخير', () => {
  seed({ generators: [gen('a')], logs: [log('1', 'a', '2026-10-10'), log('2', 'a', '2026-10-12')] });
  expect(grabApp().saveLog({ ...log('1', 'a', '2026-10-10') }).general).toBe('لا يمكن تعديل سوى آخر سجل للمولد');
 });
 it('ترفض تعيين مولد غير نشط افتراضيًا', () => {
  seed(data());
  expect(grabApp().makeDefault('c')).toBe(false);
 });
});
