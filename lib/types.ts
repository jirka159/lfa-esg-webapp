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
};
