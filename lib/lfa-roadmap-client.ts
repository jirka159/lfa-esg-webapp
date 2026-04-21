import { LFARoadmapSavePayload, LFARoadmapState } from '@/lib/types';

export async function syncRoadmapToSheet(plan: LFARoadmapState): Promise<LFARoadmapState> {
  const response = await fetch('/api/lfa-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan } satisfies LFARoadmapSavePayload)
  });

  const json = (await response.json().catch(() => ({}))) as { error?: string; plan?: LFARoadmapState };

  if (!response.ok) {
    throw new Error(json.error || 'Nepodařilo se uložit roadmapu do Google Sheetu.');
  }

  if (!json.plan) {
    throw new Error('Server nevrátil uloženou roadmapu.');
  }

  return json.plan;
}
