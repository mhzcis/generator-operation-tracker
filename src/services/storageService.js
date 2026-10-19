import { EMPTY_DATA } from '../data/defaultData';
import { normalizeDefaultGenerator } from '../utils/generators';
const KEY='generator-tracker-v1';
export const loadData=()=>{try{const x=JSON.parse(localStorage.getItem(KEY));return x&&Array.isArray(x.generators)&&Array.isArray(x.logs)?{...EMPTY_DATA,...x,generators:normalizeDefaultGenerator(x.generators)}:structuredClone(EMPTY_DATA)}catch{return structuredClone(EMPTY_DATA)}};
export const saveData=data=>localStorage.setItem(KEY,JSON.stringify(data));
export const clearData=()=>localStorage.removeItem(KEY);
