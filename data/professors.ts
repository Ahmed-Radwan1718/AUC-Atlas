import { professorRecords1 } from "./professors-1";
import { professorRecords2 } from "./professors-2";
import { professorRecords3 } from "./professors-3";
export type { Professor } from "./professors-type";
export const professors = [...professorRecords1, ...professorRecords2, ...professorRecords3];
