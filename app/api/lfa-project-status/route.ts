import { NextResponse } from 'next/server';
import { hasLfaSheetCredentials, upsertLfaProjectStatus } from '@/lib/google-sheets-lfa';
import { LFAProjectStatusUpdate } from '@/lib/types';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  const payload = (await request.json()) as LFAProjectStatusUpdate;

  if (!payload?.id || !payload?.stavZapracovani || typeof payload.muzeDoProdukce !== 'boolean') {
    return NextResponse.json({ error: 'Neplatná data požadavku.' }, { status: 400 });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 });
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
    await upsertLfaProjectStatus(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronizace se nezdařila.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
