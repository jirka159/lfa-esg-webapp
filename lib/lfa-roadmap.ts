import { LFARoadmapSheetRow, LFARoadmapState, LFARoadmapYear, LFAProject, LFAProjectType } from '@/lib/types';

export const LFA_ROADMAP_YEARS = [2026, 2027, 2028, 2029, 2030] as const satisfies readonly LFARoadmapYear[];
export const LFA_ROADMAP_MINIMUM_SECTIONS: readonly LFAProjectType[] = ['L', 'M', 'S'] as const;

export function createEmptyRoadmapPlan(): LFARoadmapState {
  return Object.fromEntries(LFA_ROADMAP_YEARS.map((year) => [year, [] as string[]])) as unknown as LFARoadmapState;
}

function dedupePreserveOrder(ids: string[]) {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeRoadmapState(input: unknown, projects: LFAProject[] = []): LFARoadmapState {
  const normalized = createEmptyRoadmapPlan();
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const used = new Set<string>();

  if (!input || typeof input !== 'object') {
    return normalized;
  }

  for (const year of LFA_ROADMAP_YEARS) {
    const yearPlan = (input as Record<string, unknown>)[String(year)] ?? (input as Record<number, unknown>)[year];

    if (Array.isArray(yearPlan)) {
      for (const rawValue of dedupePreserveOrder(yearPlan.filter((item): item is string => typeof item === 'string'))) {
        if (used.has(rawValue)) continue;
        const project = projectMap.get(rawValue);
        if (projects.length && !project) continue;
        normalized[year].push(rawValue);
        used.add(rawValue);
      }
      continue;
    }

    if (!yearPlan || typeof yearPlan !== 'object') continue;

    const values = Object.values(yearPlan)
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());

    for (const rawValue of dedupePreserveOrder(values)) {
      if (used.has(rawValue)) continue;
      const project = projectMap.get(rawValue);
      if (projects.length && !project) continue;
      normalized[year].push(rawValue);
      used.add(rawValue);
    }
  }

  return normalized;
}

export function roadmapStateToRows(plan: LFARoadmapState, actor = 'LFA admin', projects: LFAProject[] = []): LFARoadmapSheetRow[] {
  const rows: LFARoadmapSheetRow[] = [];
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  for (const year of LFA_ROADMAP_YEARS) {
    const ids = dedupePreserveOrder(plan[year] ?? []);
    const typeCounters: Record<LFAProjectType, number> = { L: 0, M: 0, S: 0 };

    for (const projectId of ids) {
      const projectType = projectMap.get(projectId)?.type ?? guessProjectTypeFromId(projectId) ?? 'S';
      typeCounters[projectType] += 1;
      rows.push({
        planId: 'default',
        clubId: 'LFA',
        year,
        slotKey: `${projectType}${typeCounters[projectType]}`,
        slotLabel: buildSlotLabel(projectType, typeCounters[projectType]),
        projectType,
        projectId,
        updatedBy: actor,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return rows;
}

export function roadmapRowsToState(rows: LFARoadmapSheetRow[], projects: LFAProject[] = []): LFARoadmapState {
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const plan = createEmptyRoadmapPlan();
  const latestBySlot = new Map<string, LFARoadmapSheetRow>();

  for (const row of rows) {
    const key = `${row.year}-${row.slotKey}`;
    const current = latestBySlot.get(key);
    if (!current) {
      latestBySlot.set(key, row);
      continue;
    }

    const currentTime = Date.parse(current.updatedAt || '');
    const nextTime = Date.parse(row.updatedAt || '');
    if ((Number.isFinite(nextTime) ? nextTime : 0) >= (Number.isFinite(currentTime) ? currentTime : 0)) {
      latestBySlot.set(key, row);
    }
  }

  const used = new Set<string>();
  const rowsByYear = new Map<LFARoadmapYear, LFARoadmapSheetRow[]>();
  for (const row of latestBySlot.values()) {
    if (!LFA_ROADMAP_YEARS.includes(row.year)) continue;
    rowsByYear.set(row.year, [...(rowsByYear.get(row.year) ?? []), row]);
  }

  for (const year of LFA_ROADMAP_YEARS) {
    const yearRows = (rowsByYear.get(year) ?? []).sort(compareRoadmapRows);
    for (const row of yearRows) {
      if (!row.projectId || used.has(row.projectId)) continue;
      const project = projectMap.get(row.projectId);
      if (projects.length && !project) continue;
      plan[year].push(row.projectId);
      used.add(row.projectId);
    }
  }

  return plan;
}

function compareRoadmapRows(a: LFARoadmapSheetRow, b: LFARoadmapSheetRow) {
  const typeOrder = typeSortWeight(a.projectType) - typeSortWeight(b.projectType);
  if (typeOrder !== 0) return typeOrder;
  return extractSlotIndex(a.slotKey) - extractSlotIndex(b.slotKey);
}

function typeSortWeight(type: LFAProjectType) {
  return type === 'L' ? 0 : type === 'M' ? 1 : 2;
}

function extractSlotIndex(slotKey: string) {
  const match = slotKey.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function buildSlotLabel(type: LFAProjectType, index: number) {
  if (type === 'L') return index === 1 ? 'Komplex' : `Komplex ${index}`;
  if (type === 'M') return index === 1 ? 'Standard' : `Standard ${index}`;
  return index === 1 ? 'Easy win' : `Easy win ${index}`;
}

function guessProjectTypeFromId(projectId: string): LFAProjectType | null {
  if (projectId.startsWith('L-')) return 'L';
  if (projectId.startsWith('M-')) return 'M';
  if (projectId.startsWith('S-')) return 'S';
  return null;
}
