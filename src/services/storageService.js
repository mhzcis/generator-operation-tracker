import { EMPTY_DATA } from '../data/defaultData';
import { normalizeDefaultGenerator } from '../utils/generators';

const KEY = 'generator-tracker-v1';

export const loadData = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY_DATA);
    const x = JSON.parse(raw);
    if (!x || !Array.isArray(x.generators) || !Array.isArray(x.logs)) {
      return structuredClone(EMPTY_DATA);
    }
    const validGenerators = x.generators.filter(g => g && typeof g === 'object' && typeof g.id === 'string');
    const validLogs = x.logs.filter(l => l && typeof l === 'object' && typeof l.id === 'string' && typeof l.date === 'string');
    return {
      ...EMPTY_DATA,
      ...x,
      generators: normalizeDefaultGenerator(validGenerators),
      logs: validLogs,
    };
  } catch {
    return structuredClone(EMPTY_DATA);
  }
};

export const saveData = data => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

export const clearData = () => {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
};
