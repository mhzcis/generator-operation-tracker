import { describe, expect, it, vi } from 'vitest';
import { parseBackup, restoreBackup, validateBackup } from './backupService';
import { gen, log, TODAY } from '../test/fixtures';

const file = content => ({ text: async () => (typeof content === 'string' ? content : JSON.stringify(content)) });
const backup = (generators, logs, extra = {}) => ({ version: '1.0', generators, logs, meta: {}, ...extra });
const valid = () => backup([gen('a'), gen('b')], [log('1', 'a', '2026-10-01', { previousReading: 0, currentReading: 10, operatingHours: 10, day: 'خطأ' }), log('2', 'a', '2026-10-02', { recordType: 'meterReset', previousReading: 10, currentReading: 3, operatingHours: 99 }), log('3', 'b', '2026-10-02', { previousReading: 5, currentReading: 9, operatingHours: 1 })]);
const reject = (x, part) => expect(() => validateBackup(x, TODAY)).toThrow(part);

describe('النسخ الاحتياطي والاستعادة', () => {
 it('يرفض ملفًا تالفًا', async () => {
  await expect(parseBackup(file('{not json'))).rejects.toThrow('الملف تالف');
  reject(null, 'بنية الملف');
  reject([], 'بنية الملف');
 });
 it('يرفض إصدارًا غير مدعوم أو بنية ناقصة', () => {
  reject({ ...valid(), version: '2.0' }, 'غير مدعوم');
  reject({ version: '1.0', generators: {}, logs: [] }, 'مفقودتان');
 });
 it('يرفض أرقام مولدات مكررة مع تجاهل حالة الأحرف والمسافات', () => {
  reject(backup([gen('a', { number: 'G-1' }), gen('b', { number: ' g-1 ' })], []), 'مكرر');
 });
 it('يرفض سجلًا يتيمًا مرتبطًا بمولد غير موجود', () => {
  reject(backup([gen('a')], [log('1', 'zz', '2026-10-01')]), 'بمولد غير موجود');
 });
 it('يرفض أكثر من سجل للمولد نفسه في اليوم نفسه', () => {
  reject(backup([gen('a')], [log('1', 'a', '2026-10-01'), log('2', 'a', '2026-10-01', { createdAt: '2026-10-01T11:00:00.000Z' })]), 'أكثر من سجل');
 });
 it('يرفض القيم السالبة وغير الرقمية وأنواع السجلات غير الصحيحة', () => {
  reject(backup([gen('a')], [log('1', 'a', '2026-10-01', { previousReading: -1 })]), 'سالبة');
  reject(backup([gen('a')], [log('1', 'a', '2026-10-01', { currentReading: 'abc' })]), 'ليست أرقامًا');
  reject(backup([gen('a')], [log('1', 'a', '2026-10-01', { recordType: 'fuel' })]), 'نوع السجل');
 });
 it('يرفض التواريخ غير الصالحة والمستقبلية وكسر قاعدة السجل اليومي', () => {
  reject(backup([gen('a')], [log('1', 'a', '2026-02-30')]), 'غير صالح');
  reject(backup([gen('a')], [log('1', 'a', '2026-10-20')]), 'مستقبليًا');
  reject(backup([gen('a')], [log('1', 'a', '2026-10-01', { previousReading: 10, currentReading: 5 })]), 'أقل من السابقة');
 });
 it('يرفض تسلسلًا زمنيًا يخالف قاعدة منع السجلات السابقة', () => {
  reject(backup([gen('a')], [log('1', 'a', '2026-10-05', { createdAt: '2026-10-05T10:00:00.000Z' }), log('2', 'a', '2026-10-03', { createdAt: '2026-10-06T10:00:00.000Z' })]), 'تسلسل');
 });
 it('يعيد حساب اليوم من التاريخ وساعات التشغيل من القراءات (تغيير العداد = صفر)', () => {
  const out = validateBackup(valid(), TODAY);
  expect(out.logs.map(l => l.day)).toEqual(['الخميس', 'الجمعة', 'الجمعة']);
  expect(out.logs.map(l => l.operatingHours)).toEqual([10, 0, 4]);
 });
 it('يسوّي أكثر من مولد افتراضي إلى واحد نشط فقط', () => {
  const out = validateBackup(backup([gen('a', { isDefault: true, status: 'inactive' }), gen('b', { isDefault: true }), gen('c', { isDefault: true })], []), TODAY);
  expect(out.generators.map(g => g.isDefault)).toEqual([false, true, false]);
 });
 it('يستورد نسخة 1.0 قديمة بلا isDefault دون خطأ ويحافظ على الحقول القديمة', () => {
  const old = valid();
  const out = validateBackup(old, TODAY);
  expect(out.generators.map(g => g.isDefault)).toEqual([false, false]);
  expect(Object.keys(out.generators[0])).toEqual(expect.arrayContaining(Object.keys(old.generators[0])));
  expect(Object.keys(out.logs[0])).toEqual(expect.arrayContaining(Object.keys(old.logs[0])));
  expect(out.version).toBe('1.0');
 });
 it('لا يثق بالإحصاءات المشتقة المخزنة في الملف', () => {
  const out = validateBackup({ ...valid(), stats: { total: 9999 } }, TODAY);
  expect(out).not.toHaveProperty('stats');
 });
 it('لا يغير البيانات الحالية عند فشل الاستعادة، وينزل نسخة أمان أولًا', async () => {
  const current = backup([gen('x')], [log('1', 'x', '2026-10-01')]);
  const snapshot = structuredClone(current), apply = vi.fn(), safety = vi.fn(() => true);
  await expect(restoreBackup(file({ ...valid(), version: '9' }), current, apply, safety)).rejects.toThrow('لم يتم تعديل البيانات الحالية');
  expect(safety).toHaveBeenCalledWith(current);
  expect(apply).not.toHaveBeenCalled();
  expect(current).toEqual(snapshot);
 });
 it('يلغي الاستعادة إذا تعذر تنزيل نسخة الأمان', async () => {
  const apply = vi.fn();
  await expect(restoreBackup(file(valid()), backup([], []), apply, () => false)).rejects.toThrow('نسخة الأمان');
  expect(apply).not.toHaveBeenCalled();
 });
 it('يطبق البيانات المستعادة عند نجاح التحقق', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 19, 12));
  const apply = vi.fn();
  await restoreBackup(file(valid()), backup([], []), apply, () => true);
  vi.useRealTimers();
  expect(apply).toHaveBeenCalledTimes(1);
  expect(apply.mock.calls[0][0].logs).toHaveLength(3);
 });
});
