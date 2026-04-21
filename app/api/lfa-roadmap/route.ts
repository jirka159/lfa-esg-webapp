import { NextResponse } from 'next/server';
import { fetchLfaProjectsFromSheet, hasLfaSheetCredentials, saveLfaRoadmapToSheet } from '@/lib/google-sheets-lfa';
import { normalizeRoadmapState } from '@/lib/lfa-roadmap';
import { LFARoadmapSavePayload } from '@/lib/types';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<LFARoadmapSavePayload>;

  if (!payload?.plan || typeof payload.plan !== 'object' || !payload.planId || !payload.clubId) {
    return NextResponse.json({ error: 'Neplatná data roadmapy.' }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 });
  }

  if (payload.planId !== user.planId || payload.clubId !== user.clubId) {
    return NextResponse.json({ error: 'Nemůžete ukládat plán jiného týmu.' }, { status: 403 });
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
    const savedPlan = await saveLfaRoadmapToSheet(
      {
        plan: normalizedPlan,
        planId: user.planId,
        clubId: user.clubId,
        updatedBy: `${user.username} • ${user.teamName}`
      },
      projects
    );
    return NextResponse.json({ ok: true, plan: savedPlan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronizace roadmapy se nezdařila.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
