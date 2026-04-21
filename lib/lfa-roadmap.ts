import {
  LFARoadmapSheetRow,
  LFARoadmapSlotKey,
  LFARoadmapState,
  LFARoadmapYear,
  LFAProject,
  LFAProjectType
} from '@/lib/types';

export const LFA_ROADMAP_YEARS = [2026, 2027, 2028, 2029, 2030] as const satisfies readonly LFARoadmapYear[];

export const LFA_ROADMAP_SLOTS = [
  { key: 'L', label: 'Komplex', type: 'L' as const },
  { key: 'M', label: 'Standard', type: 'M' as const },
  { key: 'S1', label: 'Easy win 1', type: 'S' as const },
  { key: 'S2', label: 'Easy win 2', type: 'S' as const }
] as const satisfies readonly { key: LFARoadmapSlotKey; label: string; type: LFAProjectType }[];

export const LFA_ROADMAP_SLOT_LABEL: Record<LFARoadmapSlotKey, string> = Object.fromEntries(
  LFA_ROADMAP_SLOTS.map((slot) => [slot.key, slot.label])
) as Record<LFARoadmapSlotKey, string>;

export function createEmptyRoadmapPlan(): LFARoadmapState {
  return Object.fromEntries(
    LFA_ROADMAP_YEARS.map((year) => [year, { L: null, M: null, S1: null, S2: null }])
  ) as LFARoadmapState;
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
    if (!yearPlan || typeof yearPlan !== 'object') continue;

    for (const slot of LFA_ROADMAP_SLOTS) {
      const rawValue = (yearPlan as Record<string, unknown>)[slot.key];
      if (typeof rawValue !== 'string' || !rawValue.trim() || used.has(rawValue)) continue;

      const project = projectMap.get(rawValue);
      if (project && project.type !== slot.type) continue;

      normalized[year][slot.key] = rawValue;
      used.add(rawValue);
    }
  }

  return normalized;
}

export function roadmapStateToRows(plan: LFARoadmapState, actor = 'LFA admin'): LFARoadmapSheetRow[] {
  const rows: LFARoadmapSheetRow[] = [];

  for (const year of LFA_ROADMAP_YEARS) {
    for (const slot of LFA_ROADMAP_SLOTS) {
      rows.push({
        planId: 'default',
        clubId: 'LFA',
        year,
        slotKey: slot.key,
        slotLabel: slot.label,
        projectType: slot.type,
        projectId: plan[year][slot.key],
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
  for (const slotRow of latestBySlot.values()) {
    if (!LFA_ROADMAP_YEARS.includes(slotRow.year)) continue;
    const slot = LFA_ROADMAP_SLOTS.find((item) => item.key === slotRow.slotKey);
    if (!slot) continue;

    if (!slotRow.projectId) {
      plan[slotRow.year][slotRow.slotKey] = null;
      continue;
    }

    if (used.has(slotRow.projectId)) continue;

    const project = projectMap.get(slotRow.projectId);
    if (project && project.type !== slot.type) continue;

    plan[slotRow.year][slotRow.slotKey] = slotRow.projectId;
    used.add(slotRow.projectId);
  }

  return plan;
}
