import { ESGActivity } from '@/lib/types';

export const activities: ESGActivity[] = [
  {
    id: 'energy-audit',
    title: 'Energy audit of production sites',
    category: 'Environment',
    pillar: 'E',
    effort: 'High',
    owner: 'Operations',
    dueDate: '2026-06-15',
    impact: 'Cuts energy use and creates baseline for reductions.',
    description: 'Map current energy consumption, identify quick wins and prepare 12-month savings roadmap.',
    planned: true
  },
  {
    id: 'waste-sorting',
    title: 'Company-wide waste sorting rollout',
    category: 'Environment',
    pillar: 'E',
    effort: 'Medium',
    owner: 'Facilities',
    dueDate: '2026-05-10',
    impact: 'Improves recycling rate and employee engagement.',
    description: 'Introduce visible sorting points, signage and vendor reporting across all offices.',
    planned: true
  },
  {
    id: 'supplier-code',
    title: 'Supplier code of conduct refresh',
    category: 'Governance',
    pillar: 'G',
    effort: 'Medium',
    owner: 'Procurement',
    dueDate: '2026-07-01',
    impact: 'Reduces supply-chain ESG risk and improves compliance.',
    description: 'Update supplier code with human rights, anti-corruption and environmental clauses.',
    planned: false
  },
  {
    id: 'whistleblowing',
    title: 'Whistleblowing policy and reporting channel',
    category: 'Governance',
    pillar: 'G',
    effort: 'Low',
    owner: 'Legal',
    dueDate: '2026-05-25',
    impact: 'Strengthens governance framework and incident reporting.',
    description: 'Publish policy, assign case owner and launch confidential intake form.',
    planned: false
  },
  {
    id: 'diversity-training',
    title: 'Inclusive leadership training',
    category: 'Social',
    pillar: 'S',
    effort: 'Medium',
    owner: 'HR',
    dueDate: '2026-06-30',
    impact: 'Supports leadership capability and retention.',
    description: 'Deliver short leadership workshops focused on inclusion, feedback and hiring bias.',
    planned: false
  },
  {
    id: 'community-day',
    title: 'Local community volunteer day',
    category: 'Social',
    pillar: 'S',
    effort: 'Low',
    owner: 'People & Culture',
    dueDate: '2026-05-18',
    impact: 'Builds community ties and positive employer brand.',
    description: 'Plan one volunteer day with measurable participation and impact summary.',
    planned: false
  },
  {
    id: 'esg-reporting-kpi',
    title: 'ESG KPI baseline dashboard',
    category: 'Reporting',
    pillar: 'G',
    effort: 'High',
    owner: 'Finance',
    dueDate: '2026-07-20',
    impact: 'Creates central view for key ESG progress metrics.',
    description: 'Consolidate emissions, diversity and policy KPIs into a reusable reporting view.',
    planned: true
  },
  {
    id: 'fleet-policy',
    title: 'Low-emission fleet policy',
    category: 'Environment',
    pillar: 'E',
    effort: 'Medium',
    owner: 'Operations',
    dueDate: '2026-08-15',
    impact: 'Supports emissions reduction in transport.',
    description: 'Define vehicle procurement criteria and phase-in roadmap for lower-emission options.',
    planned: false
  }
];
