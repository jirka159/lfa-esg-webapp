export type ActivityCategory =
  | 'Životní prostředí'
  | 'Sociální oblast'
  | 'Řízení a správa'
  | 'Reporting';

export type ActivityEffort = 'Nízká' | 'Střední' | 'Vysoká';

export type ESGActivity = {
  id: string;
  title: string;
  category: ActivityCategory;
  pillar: 'E' | 'S' | 'G';
  effort: ActivityEffort;
  owner: string;
  dueDate: string;
  impact: string;
  description: string;
  planned: boolean;
};

export type LFAProjectCategory = {
  id: string;
  label: string;
};

export type LFAProjectType = 'L' | 'M' | 'S';
export type LFAProjectTimeline = 'S' | 'M' | 'L';
export type LFAProjectActivityStatus = 'hotovo' | 'probiha' | 'plan';
export type LFAZapracovaniStatus = 'Idea' | 'Připravuje se' | 'Připraveno';

export type LFAProjectActivity = {
  name: string;
  status: LFAProjectActivityStatus;
};

export type LFAProject = {
  id: string;
  name: string;
  type: LFAProjectType;
  cat: string;
  narocnost: number;
  dopad: number;
  cas: LFAProjectTimeline;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  d6: number;
  d7: number;
  owner: string;
  zdroj: string;
  kpi: string;
  uefa: string;
  popis: string;
  lide?: number;
  aktivity?: LFAProjectActivity[];
  stavZapracovani: LFAZapracovaniStatus;
  muzeDoProdukce: boolean;
};

export type LFAProjectStatusUpdate = Pick<LFAProject, 'id' | 'stavZapracovani' | 'muzeDoProdukce'>;

export type LFARoadmapYear = 2026 | 2027 | 2028 | 2029 | 2030;
export type LFARoadmapSlotKey = 'L' | 'M' | 'S1' | 'S2';
export type LFARoadmapYearPlan = Record<LFARoadmapSlotKey, string | null>;
export type LFARoadmapState = Record<LFARoadmapYear, LFARoadmapYearPlan>;

export type LFARoadmapSheetRow = {
  planId: string;
  clubId: string;
  year: LFARoadmapYear;
  slotKey: LFARoadmapSlotKey;
  slotLabel: string;
  projectType: LFAProjectType;
  projectId: string | null;
  updatedBy: string;
  updatedAt: string;
};

export type LFARoadmapSavePayload = {
  plan: LFARoadmapState;
};
