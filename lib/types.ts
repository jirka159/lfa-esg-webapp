export type ActivityCategory =
  | 'Environment'
  | 'Social'
  | 'Governance'
  | 'Reporting';

export type ESGActivity = {
  id: string;
  title: string;
  category: ActivityCategory;
  pillar: 'E' | 'S' | 'G';
  effort: 'Low' | 'Medium' | 'High';
  owner: string;
  dueDate: string;
  impact: string;
  description: string;
  planned: boolean;
};
