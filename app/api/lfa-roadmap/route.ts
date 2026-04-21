import { NextResponse } from 'next/server';
import { fetchLfaProjectsFromSheet, hasLfaSheetCredentials, saveLfaRoadmapToSheet } from '@/lib/google-sheets-lfa';
import { normalizeRoadmapState } from '@/lib/lfa-roadmap';
import { LFARoadmapSavePayload } from '@/lib/types';

export async function POST(request: Request) {
  const payload = (await request.json()) as LFARoadmapSavePayload;

  if (!payload?.plan || typeof payload.plan !== 'object') {
    return NextResponse.json({ error: 'Neplatná data roadmapy.' }, { status: 400 });
  }

  if (!hasLfaSheetCredentials()) {
    return NextResponse.json(
      {
        error:
          'Google Sheet synchronizace není aktivní. Chybí GOOGLE_SERVICE_ACCOUNT_EMAIL a/nebo GOOGLE_PRIVATE_KEY ve Vercelu.'
      },
      { status: 501 }
    );
  }

  try {
    const projects = await fetchLfaProjectsFromSheet();
    const normalizedPlan = normalizeRoadmapState(payload.plan, projects);
    const savedPlan = await saveLfaRoadmapToSheet({ plan: normalizedPlan }, projects);
    return NextResponse.json({ ok: true, plan: savedPlan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronizace roadmapy se nezdařila.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
