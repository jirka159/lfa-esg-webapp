import { ESGActivity } from '@/lib/types';

export const activities: ESGActivity[] = [
  {
    id: 'energy-audit',
    title: 'Energetický audit provozů',
    category: 'Životní prostředí',
    pillar: 'E',
    effort: 'Vysoká',
    owner: 'Provoz',
    dueDate: '2026-06-15',
    impact: 'Snižuje spotřebu energie a vytváří výchozí stav pro další úspory.',
    description: 'Zmapovat současnou spotřebu energie, identifikovat rychlá opatření a připravit 12měsíční roadmapu úspor.',
    planned: true
  },
  {
    id: 'waste-sorting',
    title: 'Zavedení třídění odpadu napříč firmou',
    category: 'Životní prostředí',
    pillar: 'E',
    effort: 'Střední',
    owner: 'Správa budov',
    dueDate: '2026-05-10',
    impact: 'Zlepšuje míru recyklace a zapojení zaměstnanců.',
    description: 'Zavést viditelná třídicí místa, značení a reporting dodavatelů ve všech kancelářích.',
    planned: true
  },
  {
    id: 'supplier-code',
    title: 'Aktualizace kodexu chování dodavatelů',
    category: 'Řízení a správa',
    pillar: 'G',
    effort: 'Střední',
    owner: 'Nákup',
    dueDate: '2026-07-01',
    impact: 'Snižuje ESG rizika v dodavatelském řetězci a zlepšuje compliance.',
    description: 'Aktualizovat kodex dodavatelů o ustanovení k lidským právům, boji proti korupci a ochraně životního prostředí.',
    planned: false
  },
  {
    id: 'whistleblowing',
    title: 'Whistleblowing politika a oznamovací kanál',
    category: 'Řízení a správa',
    pillar: 'G',
    effort: 'Nízká',
    owner: 'Právní oddělení',
    dueDate: '2026-05-25',
    impact: 'Posiluje rámec řízení a hlášení incidentů.',
    description: 'Zveřejnit politiku, přiřadit vlastníka případů a spustit důvěrný formulář pro oznámení.',
    planned: false
  },
  {
    id: 'diversity-training',
    title: 'Školení inkluzivního leadershipu',
    category: 'Sociální oblast',
    pillar: 'S',
    effort: 'Střední',
    owner: 'HR',
    dueDate: '2026-06-30',
    impact: 'Podporuje kompetence vedení a retenci zaměstnanců.',
    description: 'Zrealizovat krátké workshopy pro vedoucí zaměřené na inkluzi, zpětnou vazbu a předsudky při náboru.',
    planned: false
  },
  {
    id: 'community-day',
    title: 'Dobrovolnický den pro místní komunitu',
    category: 'Sociální oblast',
    pillar: 'S',
    effort: 'Nízká',
    owner: 'Lidé a kultura',
    dueDate: '2026-05-18',
    impact: 'Posiluje vztahy s komunitou a pozitivní značku zaměstnavatele.',
    description: 'Naplánovat jeden dobrovolnický den s měřitelnou účastí a shrnutím dopadu.',
    planned: false
  },
  {
    id: 'esg-reporting-kpi',
    title: 'Dashboard výchozích ESG KPI',
    category: 'Reporting',
    pillar: 'G',
    effort: 'Vysoká',
    owner: 'Finance',
    dueDate: '2026-07-20',
    impact: 'Vytváří centrální přehled klíčových metrik pokroku v ESG.',
    description: 'Sloučit KPI pro emise, diverzitu a politiky do znovupoužitelného reportovacího přehledu.',
    planned: true
  },
  {
    id: 'fleet-policy',
    title: 'Politika nízkoemisního vozového parku',
    category: 'Životní prostředí',
    pillar: 'E',
    effort: 'Střední',
    owner: 'Provoz',
    dueDate: '2026-08-15',
    impact: 'Podporuje snižování emisí v dopravě.',
    description: 'Definovat kritéria pro pořizování vozidel a roadmapu postupného přechodu na nízkoemisní varianty.',
    planned: false
  }
];
