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
