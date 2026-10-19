import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildExcelWorkbook, describeFilters, enrich, EXCEL_HEADER_ROW, EXCEL_SHEET_NAME, filterLogs, reportLabels } from './reportService';
import { gen, log } from '../test/fixtures';

const generators = [gen('a', { number: 'G-1', name: 'مولد الورشة' }), gen('b', { number: 'G-2', name: 'مولد المكاتب' })];
const logs = [
 log('1', 'a', '2026-10-01', { day: 'الخميس', previousReading: 0, currentReading: 10, operatingHours: 10, notes: 'تشغيل عادي' }),
 log('2', 'a', '2026-10-02', { day: 'الجمعة', previousReading: 10, currentReading: 1500.5, operatingHours: 1490.5 }),
 log('3', 'b', '2026-10-02', { day: 'الجمعة', recordType: 'meterReset', previousReading: 30, currentReading: 2, operatingHours: 0 }),
 log('4', 'b', '2026-10-03', { day: 'السبت', previousReading: 2, currentReading: 8, operatingHours: 6 }),
];
const init = { q: '', from: '', to: '', day: 'all', generator: 'all', type: 'all', prev: '', current: '', hours: '' };
const roundTrip = async wb => { const out = new ExcelJS.Workbook(); await out.xlsx.load(await wb.xlsx.writeBuffer()); return out; };

describe('التقارير وExcel', () => {
 const filters = { ...init, generator: 'a', from: '2026-10-02', type: 'daily' };
 const filtered = enrich(filterLogs(logs, generators, filters), generators);
 const columns = ['operatingHours', 'generatorName', 'date', 'notes'];

 it('Excel يحتوي النتائج المفلترة فقط', async () => {
  expect(filtered.map(x => x.id)).toEqual(['2']);
  const ws = (await roundTrip(buildExcelWorkbook(ExcelJS, filtered, columns, { filtersText: describeFilters(filters, generators) }))).getWorksheet(EXCEL_SHEET_NAME);
  expect(ws.rowCount).toBe(EXCEL_HEADER_ROW + 1);
  expect(ws.getRow(EXCEL_HEADER_ROW + 1).getCell(1).value).toBe(1490.5);
  expect(ws.getCell('A3').value).toBe('عدد النتائج: 1');
 });
 it('Excel يحترم الأعمدة المختارة وترتيبها', async () => {
  const ws = (await roundTrip(buildExcelWorkbook(ExcelJS, filtered, columns))).getWorksheet(EXCEL_SHEET_NAME);
  const header = ws.getRow(EXCEL_HEADER_ROW).values.slice(1);
  expect(header).toEqual(columns.map(c => reportLabels[c]));
  expect(ws.getRow(EXCEL_HEADER_ROW).cellCount).toBe(4);
 });
 it('ورقة Excel باتجاه RTL ومنسقة: عنوان مدمج وتجميد وفلتر تلقائي وحدود وتنسيقات أرقام وتواريخ وطباعة', async () => {
  const all = enrich(filterLogs(logs, generators, init), generators), cols = Object.keys(reportLabels);
  const ws = (await roundTrip(buildExcelWorkbook(ExcelJS, all, cols, { filtersText: 'لا يوجد' }))).getWorksheet(EXCEL_SHEET_NAME);
  expect(ws.name).toBe('تقرير التشغيل');
  expect(ws.views[0]).toMatchObject({ rightToLeft: true, state: 'frozen', ySplit: EXCEL_HEADER_ROW });
  expect(ws.getCell('A1').value).toBe('تقرير تشغيل المولدات');
  expect(ws.model.merges).toEqual(expect.arrayContaining(['A1:J1', 'A2:J2', 'A3:J3', 'A4:J4']));
  expect(ws.getCell('A1').font).toMatchObject({ bold: true, size: 18 });
  expect(ws.getCell('A1').fill.fgColor.argb).toBe('FF0F766E');
  expect(String(ws.autoFilter)).toBe('A5:J5');
  const head = ws.getCell(`A${EXCEL_HEADER_ROW}`);
  expect(head.font.bold).toBe(true);
  expect(head.fill.fgColor.argb).toBe('FF115E59');
  const first = ws.getRow(EXCEL_HEADER_ROW + 1);
  expect(first.getCell(1).value).toBeInstanceOf(Date);
  expect(first.getCell(1).numFmt).toBe('dd/mm/yyyy');
  expect(first.getCell(1).border.top.style).toBe('thin');
  const notes = first.getCell(cols.indexOf('notes') + 1);
  expect(notes.alignment).toMatchObject({ wrapText: true, horizontal: 'right' });
  expect(typeof first.getCell(cols.indexOf('operatingHours') + 1).value).toBe('number');
  expect(first.getCell(cols.indexOf('currentReading') + 1).numFmt).toMatch(/#,##0/);
  ws.columns.forEach(c => { expect(c.width).toBeGreaterThanOrEqual(12); expect(c.width).toBeLessThanOrEqual(50); });
  expect(ws.pageSetup).toMatchObject({ orientation: 'landscape', fitToWidth: 1, printTitlesRow: '5:5', paperSize: 9 });
 });
 it('يصوغ الفلاتر المطبقة بالعربية لا بأسماء المفاتيح', () => {
  const text = describeFilters({ ...init, q: 'ورشة', generator: 'a', type: 'meterReset', from: '2026-10-01', hours: '0' }, generators);
  expect(text).toBe('بحث شامل: «ورشة»، من تاريخ: 01/10/2026، المولد: G-1 | مولد الورشة، نوع السجل: تغيير عداد، ساعات التشغيل: 0');
  expect(text).not.toMatch(/generator|type|from|hours/);
  expect(describeFilters(init, generators)).toBe('');
 });
 it('يعرض السجلات الأحدث أولًا', () => {
  expect(filterLogs(logs, generators, init).map(x => x.id)).toEqual(['4', '2', '3', '1']);
 });
});
