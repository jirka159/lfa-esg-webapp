import { createSign } from 'crypto';
import { LFAProjectStatusUpdate } from '@/lib/types';

const SHEET_NAME = 'Projekty';
const HEADER_ROW = [
  'ID projektu',
  'Název projektu',
  'Stav zapracování',
  'Může do produkce',
  'Aktualizováno'
] as const;

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return key ? key.replace(/\\n/g, '\n') : null;
}

export function getLfaSheetConfig() {
  return {
    spreadsheetId: getEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
    clientEmail: getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    privateKey: getPrivateKey()
  };
}

export function hasLfaSheetCredentials() {
  const config = getLfaSheetConfig();
  return Boolean(config.spreadsheetId && config.clientEmail && config.privateKey);
}

function requireLfaSheetCredentials() {
  const config = getLfaSheetConfig();
  if (!config.spreadsheetId || !config.clientEmail || !config.privateKey) {
    throw new Error('Chybí Google Sheets credentials.');
  }

  return {
    spreadsheetId: config.spreadsheetId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey
  };
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64Url(signature)}`
    })
  });

  if (!response.ok) {
    throw new Error('Nepodařilo se získat Google access token.');
  }

  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

async function sheetsRequest<T>(
  path: string,
  init: RequestInit,
  credentials: { spreadsheetId: string; clientEmail: string; privateKey: string }
): Promise<T> {
  const accessToken = await getAccessToken(credentials.clientEmail, credentials.privateKey);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets API error: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function ensureLfaProjectsSheet() {
  const credentials = requireLfaSheetCredentials();

  try {
    await sheetsRequest(`values/${encodeURIComponent(`${SHEET_NAME}!A1:E1`)}`, { method: 'GET' }, credentials);
  } catch {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken(credentials.clientEmail, credentials.privateKey)}`
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME
                }
              }
            }
          ]
        })
      }
    );
  }

  await sheetsRequest(
    `values/${encodeURIComponent(`${SHEET_NAME}!A1:E1`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: [HEADER_ROW] })
    },
    credentials
  );
}

export async function upsertLfaProjectStatus(update: LFAProjectStatusUpdate & { projectName?: string }) {
  const credentials = requireLfaSheetCredentials();

  await ensureLfaProjectsSheet();

  const targetRow = [
    update.id,
    update.projectName ?? '',
    update.stavZapracovani,
    update.muzeDoProdukce ? 'Ano' : 'Ne',
    new Date().toISOString()
  ];

  await sheetsRequest(
    `values/${encodeURIComponent(`${SHEET_NAME}!A:E`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [targetRow] })
    },
    credentials
  );
}
