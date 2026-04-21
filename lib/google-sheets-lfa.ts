import { createSign } from 'crypto';
import { lfaProjects, lfaProjectsSeed } from '@/data/lfa-projects';
import { LFAProject, LFAProjectStatusUpdate, LFAZapracovaniStatus } from '@/lib/types';

const SHEET_NAME = 'Projekty';
const HEADER_ROW = [
  'ID projektu',
  'Název projektu',
  'Typ',
  'Kategorie',
  'Náročnost',
  'Dopad',
  'Čas',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'Owner',
  'Zdroj',
  'KPI',
  'UEFA',
  'Popis',
  'Lidé',
  'Aktivity JSON',
  'Stav zapracování',
  'Může do produkce',
  'Aktualizováno'
] as const;

const STATUS_VALUES: LFAZapracovaniStatus[] = ['Idea', 'Připravuje se', 'Připraveno'];

type SheetCredentials = {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
};

type ValueRangeResponse = {
  values?: string[][];
};

type SheetValues = Record<(typeof HEADER_ROW)[number], string>;

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getPrivateKey() {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) return null;

  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  key = key
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();

  return key;
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

function requireLfaSheetCredentials(): SheetCredentials {
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

async function authorizedJsonFetch<T>(url: string, init: RequestInit, credentials: SheetCredentials): Promise<T> {
  const accessToken = await getAccessToken(credentials.clientEmail, credentials.privateKey);
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets API error: ${text}`);
  }

  return response.json() as Promise<T>;
}

async function sheetsRequest<T>(path: string, init: RequestInit, credentials: SheetCredentials): Promise<T> {
  return authorizedJsonFetch<T>(
    `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}/${path}`,
    init,
    credentials
  );
}

async function batchUpdate(requests: unknown[], credentials: SheetCredentials) {
  return authorizedJsonFetch<{ replies?: unknown[] }>(
    `https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({ requests })
    },
    credentials
  );
}

function parseNumber(value: string, fallback = 0) {
  if (!value) return fallback;
  const normalized = Number(value.toString().replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : fallback;
}

function parseOptionalNumber(value: string) {
  if (!value) return undefined;
  const parsed = parseNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string) {
  return ['ano', 'true', '1', 'yes'].includes(value.trim().toLowerCase());
}

function parseActivities(value: string): LFAProject['aktivity'] {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as LFAProject['aktivity'];
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeStatus(value: string, fallback: LFAZapracovaniStatus): LFAZapracovaniStatus {
  return STATUS_VALUES.includes(value as LFAZapracovaniStatus) ? (value as LFAZapracovaniStatus) : fallback;
}

function defaultProjectStatus(project: (typeof lfaProjects)[number]) {
  return {
    stavZapracovani: project.stavZapracovani,
    muzeDoProdukce: project.muzeDoProdukce
  };
}

function projectToSheetRow(project: LFAProject): string[] {
  return [
    project.id,
    project.name,
    project.type,
    project.cat,
    String(project.narocnost),
    String(project.dopad),
    project.cas,
    String(project.d1),
    String(project.d2),
    String(project.d3),
    String(project.d4),
    String(project.d5),
    String(project.d6),
    String(project.d7),
    project.owner,
    project.zdroj,
    project.kpi,
    project.uefa,
    project.popis,
    project.lide != null ? String(project.lide) : '',
    project.aktivity?.length ? JSON.stringify(project.aktivity) : '',
    project.stavZapracovani,
    project.muzeDoProdukce ? 'Ano' : 'Ne',
    new Date().toISOString()
  ];
}

function rowToProject(row: string[], header: string[]): LFAProject | null {
  const values = Object.fromEntries(
    HEADER_ROW.map((column, index) => [column, row[header.indexOf(column)] ?? ''])
  ) as SheetValues;

  if (!values['ID projektu'] || !values['Název projektu']) return null;

  const seedFallback = lfaProjects.find((project) => project.id === values['ID projektu']);

  return {
    id: values['ID projektu'],
    name: values['Název projektu'],
    type: (values['Typ'] || seedFallback?.type || 'S') as LFAProject['type'],
    cat: values['Kategorie'] || seedFallback?.cat || '',
    narocnost: parseNumber(values['Náročnost'], seedFallback?.narocnost ?? 0),
    dopad: parseNumber(values['Dopad'], seedFallback?.dopad ?? 0),
    cas: (values['Čas'] || seedFallback?.cas || 'S') as LFAProject['cas'],
    d1: parseNumber(values['D1'], seedFallback?.d1 ?? 0),
    d2: parseNumber(values['D2'], seedFallback?.d2 ?? 0),
    d3: parseNumber(values['D3'], seedFallback?.d3 ?? 0),
    d4: parseNumber(values['D4'], seedFallback?.d4 ?? 0),
    d5: parseNumber(values['D5'], seedFallback?.d5 ?? 0),
    d6: parseNumber(values['D6'], seedFallback?.d6 ?? 0),
    d7: parseNumber(values['D7'], seedFallback?.d7 ?? 0),
    owner: values['Owner'] || seedFallback?.owner || '',
    zdroj: values['Zdroj'] || seedFallback?.zdroj || '',
    kpi: values['KPI'] || seedFallback?.kpi || '',
    uefa: values['UEFA'] || seedFallback?.uefa || '',
    popis: values['Popis'] || seedFallback?.popis || '',
    lide: parseOptionalNumber(values['Lidé']) ?? seedFallback?.lide,
    aktivity: parseActivities(values['Aktivity JSON']) ?? seedFallback?.aktivity,
    stavZapracovani: sanitizeStatus(
      values['Stav zapracování'],
      seedFallback ? defaultProjectStatus(seedFallback).stavZapracovani : 'Idea'
    ),
    muzeDoProdukce: values['Může do produkce']
      ? parseBoolean(values['Může do produkce'])
      : (seedFallback ? defaultProjectStatus(seedFallback).muzeDoProdukce : false)
  };
}

async function getSheetValues(range: string, credentials: SheetCredentials) {
  return sheetsRequest<ValueRangeResponse>(`values/${encodeURIComponent(range)}`, { method: 'GET' }, credentials);
}

export async function ensureLfaProjectsSheet() {
  const credentials = requireLfaSheetCredentials();

  let existingHeader: string[] = [];
  try {
    const response = await getSheetValues(`${SHEET_NAME}!1:1`, credentials);
    existingHeader = response.values?.[0] ?? [];
  } catch {
    await batchUpdate(
      [
        {
          addSheet: {
            properties: {
              title: SHEET_NAME
            }
          }
        }
      ],
      credentials
    );
  }

  const mergedHeader = [...HEADER_ROW].filter(Boolean);
  const headerChanged =
    existingHeader.length !== mergedHeader.length ||
    mergedHeader.some((value, index) => existingHeader[index] !== value);

  if (headerChanged) {
    await sheetsRequest(
      `values/${encodeURIComponent(`${SHEET_NAME}!A1:X1`)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [mergedHeader] })
      },
      credentials
    );
  }
}

export async function fetchLfaProjectsFromSheet(): Promise<LFAProject[]> {
  if (!hasLfaSheetCredentials()) {
    return lfaProjects;
  }

  const credentials = requireLfaSheetCredentials();
  await ensureLfaProjectsSheet();
  const response = await getSheetValues(`${SHEET_NAME}!A:X`, credentials);
  const [header = [], ...rows] = response.values ?? [];

  if (!header.length || rows.length === 0) {
    return lfaProjects;
  }

  const projects = rows
    .map((row) => rowToProject(row, header))
    .filter((project): project is LFAProject => Boolean(project));

  return projects.length ? projects : lfaProjects;
}

export async function fetchLfaProjectById(id: string): Promise<LFAProject | null> {
  const projects = await fetchLfaProjectsFromSheet();
  return projects.find((project) => project.id === id) ?? null;
}

export async function syncSeedProjectsToSheet(projects: LFAProject[] = lfaProjects) {
  const credentials = requireLfaSheetCredentials();
  await ensureLfaProjectsSheet();
  const values = [HEADER_ROW as unknown as string[], ...projects.map(projectToSheetRow)];

  await sheetsRequest(
    `values/${encodeURIComponent(`${SHEET_NAME}!A1:X${values.length}`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values })
    },
    credentials
  );

  return { count: projects.length };
}

export async function upsertLfaProjectStatus(update: LFAProjectStatusUpdate) {
  const credentials = requireLfaSheetCredentials();
  await ensureLfaProjectsSheet();

  const response = await getSheetValues(`${SHEET_NAME}!A:X`, credentials);
  const [header = [], ...rows] = response.values ?? [];
  if (!header.length) {
    throw new Error('Záložka Projekty nemá hlavičku.');
  }

  const idIndex = header.indexOf('ID projektu');
  const statusIndex = header.indexOf('Stav zapracování');
  const prodIndex = header.indexOf('Může do produkce');
  const updatedIndex = header.indexOf('Aktualizováno');

  const rowIndex = rows.findIndex((row) => row[idIndex] === update.id);
  if (rowIndex === -1) {
    throw new Error(`Projekt ${update.id} v Google Sheetu neexistuje. Nejprve spusť seed/import.`);
  }

  const absoluteRow = rowIndex + 2;
  const currentRow = [...rows[rowIndex]];
  currentRow[statusIndex] = update.stavZapracovani;
  currentRow[prodIndex] = update.muzeDoProdukce ? 'Ano' : 'Ne';
  currentRow[updatedIndex] = new Date().toISOString();

  const lastColumnLetter = 'X';
  await sheetsRequest(
    `values/${encodeURIComponent(`${SHEET_NAME}!A${absoluteRow}:${lastColumnLetter}${absoluteRow}`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: [currentRow] })
    },
    credentials
  );
}

export const lfaSheetHeaderRow = HEADER_ROW;
export const lfaProjectsSeedForSheet = lfaProjectsSeed;
