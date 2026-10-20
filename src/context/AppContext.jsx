import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { clearData, loadState, saveData } from '../services/storageService';
import { EMPTY_DATA } from '../data/defaultData';
import {
  downloadBackup,
  downloadCorruptRaw,
  isFileSystemAccessSupported,
  linkBackupFile,
  linkedBackupFileName,
  restoreBackup,
  unlinkBackupFile,
  wipeAllData,
  writeLinkedBackup,
} from '../services/backupService';
import { dayName, isoNow } from '../utils/dates';
import { generatorLogs, latestLog, previousLog, roundHours } from '../utils/calculations';
import { normalizeDefaultGenerator, setDefaultGenerator } from '../utils/generators';
import { validateGenerator, validateLog } from '../utils/validators';

const C = createContext();
export const useApp = () => useContext(C);

export function AppProvider({ children }) {
  const [initial] = useState(loadState);
  const [data, setData] = useState(initial.data);
  const [corrupt, setCorrupt] = useState(initial.corrupt);
  const [notice, setNotice] = useState(null);
  const [linkedFile, setLinkedFile] = useState(null);
  const fileLinkSupported = isFileSystemAccessSupported();

  const SAVE_FAILED =
    'تعذر حفظ البيانات في ذاكرة المتصفح (قد تكون مساحة التخزين ممتلئة أو التخزين معطّلًا). لن تبقى التعديلات الأخيرة بعد إغلاق الصفحة، فنزّل نسخة احتياطية الآن.';

  useEffect(() => {
    // عند اكتشاف بيانات تالفة لا نكتب فوقها حتى يختار المستخدم طريقة المتابعة.
    if (corrupt) return;
    if (!saveData(data)) setNotice({ type: 'error', text: SAVE_FAILED });
  }, [data, corrupt]);

  const BACKUP_FAILED =
    'تعذر بدء تنزيل النسخة الاحتياطية تلقائيًا، ربما منعه المتصفح. استخدم زر «نسخة احتياطية» لتنزيلها يدويًا.';

  const commit = (next, msg, backup = true) => {
    setData(next);
    const started = backup ? downloadBackup(next) : true;
    setNotice(
      started
        ? { type: 'success', text: backup ? `${msg}. تم بدء تنزيل النسخة الاحتياطية` : msg }
        : { type: 'warning', text: `${msg}. ${BACKUP_FAILED}` }
    );
  };

  const addGenerator = form => {
    const e = validateGenerator(form, data.generators);
    if (Object.keys(e).length) return e;
    const now = isoNow();
    const entry = {
      ...form,
      latitude: form.latitude ?? '',
      longitude: form.longitude ?? '',
      isDefault: false,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    commit({ ...data, generators: [...data.generators, entry] }, 'تمت إضافة المولد');
    return {};
  };

  const updateGenerator = form => {
    const e = validateGenerator(form, data.generators);
    if (Object.keys(e).length) return e;
    const generators = normalizeDefaultGenerator(
      data.generators.map(x =>
        x.id === form.id
          ? {
              ...x,
              ...form,
              latitude: form.latitude ?? x.latitude ?? '',
              longitude: form.longitude ?? x.longitude ?? '',
              updatedAt: isoNow(),
            }
          : x
      )
    );
    const lostDefault =
      data.generators.find(x => x.id === form.id)?.isDefault === true &&
      !generators.find(x => x.id === form.id).isDefault;
    commit(
      { ...data, generators },
      lostDefault ? 'تم تحديث المولد وإلغاء تعيينه افتراضيًا لأنه غير نشط' : 'تم تحديث المولد'
    );
    return {};
  };

  const makeDefault = id => {
    const g = data.generators.find(x => x.id === id);
    if (!g || g.status !== 'active') {
      setNotice({ type: 'error', text: 'لا يمكن تعيين مولد غير نشط افتراضيًا' });
      return false;
    }
    const now = isoNow();
    commit(
      {
        ...data,
        generators: setDefaultGenerator(data.generators, id).map((x, i) =>
          x.isDefault === (data.generators[i].isDefault === true) ? x : { ...x, updatedAt: now }
        ),
      },
      'تم تعيين المولد الافتراضي'
    );
    return true;
  };

  const saveLog = input => {
    const gl = generatorLogs(data.logs, input.generatorId);
    const editing = !!input.id;
    const last = gl[0];
    if (editing && last?.id !== input.id) {
      return { general: 'لا يمكن تعديل سوى آخر سجل للمولد' };
    }
    const prev = previousLog(data.logs, input.generatorId, input.id);
    const form = prev ? { ...input, previousReading: prev.currentReading } : input;
    const e = validateLog(form, data.logs);
    if (Object.keys(e).length) return e;

    const prevNum = Number(form.previousReading);
    const currNum = Number(form.currentReading);
    const normalized = {
      ...form,
      day: dayName(form.date),
      previousReading: prevNum,
      currentReading: currNum,
      operatingHours: form.recordType === 'meterReset' ? 0 : roundHours(currNum - prevNum),
    };
    const now = isoNow();
    let logs;
    if (editing) {
      logs = data.logs.map(x =>
        x.id === form.id ? { ...x, ...normalized, edited: true, updatedAt: now } : x
      );
    } else {
      logs = [
        ...data.logs,
        { ...normalized, id: uuid(), createdAt: now, updatedAt: now, edited: false },
      ];
    }
    commit({ ...data, logs }, editing ? 'تم تحديث السجل' : 'تم حفظ السجل');
    return { id: editing ? form.id : logs.at(-1).id };
  };

  const deleteLog = id => {
    const target = data.logs.find(x => x.id === id);
    if (!target) return false;
    if (latestLog(data.logs, target.generatorId)?.id !== id) {
      setNotice({ type: 'error', text: 'لا يمكن حذف سوى آخر سجل للمولد' });
      return false;
    }
    commit({ ...data, logs: data.logs.filter(x => x.id !== id) }, 'تم حذف السجل');
    return true;
  };

  const restore = async file => {
    try {
      await restoreBackup(file, data, next => {
        setData(next);
        saveData(next);
      });
      setCorrupt(null);
      setNotice({
        type: 'success',
        text: 'تم بدء تنزيل نسخة أمان من البيانات الحالية، وتمت استعادة النسخة الاحتياطية بنجاح',
      });
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const manualBackup = () =>
    setNotice(
      downloadBackup(data)
        ? { type: 'success', text: 'تم بدء تنزيل النسخة الاحتياطية' }
        : {
            type: 'error',
            text: 'تعذر بدء تنزيل النسخة الاحتياطية، ربما منعه المتصفح. اسمح بالتنزيلات لهذا الموقع ثم أعد المحاولة.',
          }
    );

  const wipeAll = () => {
    try {
      wipeAllData(data, () => {
        clearData();
        setData(structuredClone(EMPTY_DATA));
      });
      setNotice({
        type: 'success',
        text: 'تم بدء تنزيل نسخة أمان، وتم مسح جميع المولدات والسجلات',
      });
      return true;
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
      return false;
    }
  };

  const downloadCorrupt = () =>
    setNotice(
      corrupt && downloadCorruptRaw(corrupt.raw)
        ? { type: 'success', text: 'تم بدء تنزيل البيانات التالفة كما هي' }
        : { type: 'error', text: 'تعذر بدء تنزيل البيانات التالفة، ربما منعه المتصفح.' }
    );

  const startFresh = () => {
    const kept = corrupt?.key;
    setData(structuredClone(EMPTY_DATA));
    setCorrupt(null);
    setNotice({
      type: 'info',
      text: kept
        ? `تم البدء ببيانات جديدة. ما زالت البيانات التالفة محفوظة في المتصفح باسم «\u2066${kept}\u2069».`
        : 'تم البدء ببيانات جديدة.',
    });
  };

  const linkBackup = async () => {
    if (!fileLinkSupported) return false;
    if (!(await linkBackupFile())) {
      setNotice({ type: 'info', text: 'لم يتم ربط أي ملف.' });
      return false;
    }
    if (!(await writeLinkedBackup(data))) {
      unlinkBackupFile();
      setLinkedFile(null);
      setNotice({ type: 'error', text: 'تعذرت الكتابة في الملف المختار، لذلك لم يتم ربطه.' });
      return false;
    }
    const name = linkedBackupFileName() || 'ملف النسخة الاحتياطية';
    setLinkedFile(name);
    setNotice({
      type: 'success',
      text: `تم ربط الملف «${name}» وحفظ البيانات فيه. سيُحدَّث تلقائيًا بعد كل تعديل خلال هذه الجلسة، مع استمرار التنزيل التلقائي.`,
    });
    return true;
  };

  const unlinkBackup = () => {
    unlinkBackupFile();
    setLinkedFile(null);
    setNotice({ type: 'info', text: 'تم إلغاء ربط ملف النسخة الاحتياطية. يستمر التنزيل التلقائي كالمعتاد.' });
  };

  const value = useMemo(
    () => ({
      data,
      notice,
      setNotice,
      addGenerator,
      updateGenerator,
      makeDefault,
      saveLog,
      deleteLog,
      restore,
      manualBackup,
      wipeAll,
      corrupt,
      downloadCorrupt,
      startFresh,
      fileLinkSupported,
      linkedFile,
      linkBackup,
      unlinkBackup,
    }),
    [data, notice, corrupt, linkedFile]
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
