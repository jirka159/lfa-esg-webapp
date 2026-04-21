import { LFAProject, LFAProjectStatusUpdate, LFAZapracovaniStatus } from '@/lib/types';

export const LFA_PROJECT_STATUS_STORAGE_KEY = 'lfa-esg-project-status-v1';
export const LFA_ZAPRACOVANI_OPTIONS: LFAZapracovaniStatus[] = ['Idea', 'Připravuje se', 'Připraveno'];

export function statusBadgeClass(status: LFAZapracovaniStatus) {
  switch (status) {
    case 'Idea':
      return 'statusIdea';
    case 'Připravuje se':
      return 'statusPreparing';
    case 'Připraveno':
      return 'statusReady';
  }
}

export function mergeProjectStatus(projects: LFAProject[], updates: Record<string, LFAProjectStatusUpdate>) {
  return projects.map((project) => {
    const update = updates[project.id];
    return update ? { ...project, ...update } : project;
  });
}

export function readProjectStatusOverrides(): Record<string, LFAProjectStatusUpdate> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(LFA_PROJECT_STATUS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LFAProjectStatusUpdate>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function writeProjectStatusOverrides(updates: Record<string, LFAProjectStatusUpdate>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LFA_PROJECT_STATUS_STORAGE_KEY, JSON.stringify(updates));
}

export async function syncProjectStatusToSheet(update: LFAProjectStatusUpdate) {
  const response = await fetch('/api/lfa-project-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Synchronizace do Google Sheetu se nepodařila.');
  }

  return response.json() as Promise<{ ok: true }>;
}
