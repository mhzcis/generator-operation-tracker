import { describe, expect, it } from 'vitest';
import { validateGenerator, validateLog } from './validators';

describe('التحقق', () => {
  it('يرفض رقم مولد مكرر', () =>
    expect(
      validateGenerator(
        { id: '2', number: 'G1', name: 'ب', location: 'م', capacity: '' },
        [{ id: '1', number: 'g1' }]
      ).number
    ).toBeTruthy());

  it('يرفض قراءة يومية أقل', () =>
    expect(
      validateLog(
        {
          id: '',
          generatorId: 'g',
          date: '2025-01-01',
          recordType: 'daily',
          previousReading: 10,
          currentReading: 2,
          notes: '',
        },
        []
      ).currentReading
    ).toBeTruthy());

  it('يسمح بانخفاض تغيير العداد', () =>
    expect(
      validateLog(
        {
          id: '',
          generatorId: 'g',
          date: '2025-01-01',
          recordType: 'meterReset',
          previousReading: 10,
          currentReading: 0,
          notes: '',
        },
        []
      ).currentReading
    ).toBeUndefined());

  it('يقبل إحداثيات العرض والطول الاختيارية الفارغة أو الصالحة ويرفض الخارجة عن النطاق', () => {
    const base = { id: '1', number: 'G1', name: 'مولد 1', location: 'غزة', capacity: '' };
    expect(validateGenerator({ ...base, latitude: '', longitude: '' }, [])).toEqual({});
    expect(validateGenerator({ ...base, latitude: '31.3461', longitude: '34.3064' }, [])).toEqual({});
    expect(validateGenerator({ ...base, latitude: '95', longitude: '34' }, []).latitude).toBeTruthy();
    expect(validateGenerator({ ...base, latitude: '-91', longitude: '34' }, []).latitude).toBeTruthy();
    expect(validateGenerator({ ...base, latitude: '31', longitude: '185' }, []).longitude).toBeTruthy();
    expect(validateGenerator({ ...base, latitude: '31', longitude: '-181' }, []).longitude).toBeTruthy();
  });
});
