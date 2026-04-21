import { LFAProjectStatusUpdate, LFAZapracovaniStatus } from '@/lib/types';

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
