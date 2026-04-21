#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { createSign } from 'crypto';

const PROJECT_SHEET_NAME = 'Projekty';
const ROADMAP_SHEET_NAME = 'Plany_klubu';
const PROJECT_HEADER_ROW = [
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
];
const ROADMAP_HEADER_ROW = [
  'Plan ID',
  'Klub ID',
  'Rok',
  'Slot key',
  'Slot label',
  'Typ projektu',
  'ID projektu',
  'Uložil',
  'Aktualizováno'
];
const ROADMAP_YEARS = [2026, 2027, 2028, 2029, 2030];
const ROADMAP_SLOTS = [
  { key: 'L', label: 'Komplex', type: 'L' },
  { key: 'M', label: 'Standard', type: 'M' },
  { key: 'S1', label: 'Easy win 1', type: 'S' },
  { key: 'S2', label: 'Easy win 2', type: 'S' }
];

const DEFAULT_STATUS_BY_TYPE = {
  L: 'Připravuje se',
  M: 'Připravuje se',
  S: 'Idea'
};

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  return key ? key.replace(/\\n/g, '\n') : null;
}

async function getAccessToken(clientEmail, privateKey) {
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

  if (!response.ok) throw new Error(await response.text());
  const json = await response.json();
  return json.access_token;
}

async function sheetsRequest(path, init, credentials) {
  const accessToken = await getAccessToken(credentials.clientEmail, credentials.privateKey);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function batchUpdate(requests, credentials) {
  const accessToken = await getAccessToken(credentials.clientEmail, credentials.privateKey);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${credentials.spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function parseSeedProjects() {
  const source = await readFile(new URL('../data/lfa-projects.ts', import.meta.url), 'utf8');
  const match = source.match(/export const lfaProjectsSeed = (\[[\s\S]*?\]) as Omit<LFAProject, 'stavZapracovani' \| 'muzeDoProdukce'>\[];/);
  if (!match) throw new Error('Nepodařilo se načíst lfaProjectsSeed z data/lfa-projects.ts');
  const projects = Function(`"use strict"; return (${match[1]});`)();
  return projects.map((project) => ({
    ...project,
    stavZapracovani: DEFAULT_STATUS_BY_TYPE[project.type],
    muzeDoProdukce: false
  }));
}

function projectToRow(project) {
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
    project.owner ?? '',
    project.zdroj ?? '',
    project.kpi ?? '',
    project.uefa ?? '',
    project.popis ?? '',
    project.lide != null ? String(project.lide) : '',
    project.aktivity?.length ? JSON.stringify(project.aktivity) : '',
    project.stavZapracovani,
    project.muzeDoProdukce ? 'Ano' : 'Ne',
    new Date().toISOString()
  ];
}

function roadmapSeedRows() {
  const now = new Date().toISOString();
  return ROADMAP_YEARS.flatMap((year) =>
    ROADMAP_SLOTS.map((slot) => [
      'default',
      'LFA',
      String(year),
      slot.key,
      slot.label,
      slot.type,
      '',
      'seed',
      now
    ])
  );
}

async function ensureSheetHeader(sheetName, headerRow, credentials) {
  const lastColumnLetter = String.fromCharCode(64 + headerRow.length);

  try {
    await sheetsRequest(`values/${encodeURIComponent(`${sheetName}!1:1`)}`, { method: 'GET' }, credentials);
  } catch {
    await batchUpdate(
      [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ],
      credentials
    );
  }

  await sheetsRequest(
    `values/${encodeURIComponent(`${sheetName}!A1:${lastColumnLetter}1`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: [headerRow] })
    },
    credentials
  );
}

async function main() {
  const credentials = {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: getPrivateKey()
  };

  if (!credentials.spreadsheetId || !credentials.clientEmail || !credentials.privateKey) {
    throw new Error('Chybí GOOGLE_SHEETS_SPREADSHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY');
  }

  const projects = await parseSeedProjects();
  const projectValues = [PROJECT_HEADER_ROW, ...projects.map(projectToRow)];
  const roadmapValues = [ROADMAP_HEADER_ROW, ...roadmapSeedRows()];

  await ensureSheetHeader(PROJECT_SHEET_NAME, PROJECT_HEADER_ROW, credentials);
  await ensureSheetHeader(ROADMAP_SHEET_NAME, ROADMAP_HEADER_ROW, credentials);

  await sheetsRequest(
    `values/${encodeURIComponent(`${PROJECT_SHEET_NAME}!A1:X${projectValues.length}`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: projectValues })
    },
    credentials
  );

  await sheetsRequest(
    `values/${encodeURIComponent(`${ROADMAP_SHEET_NAME}!A1:I${roadmapValues.length}`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values: roadmapValues })
    },
    credentials
  );

  console.log(`Google Sheet synchronizován: ${projects.length} projektů a ${roadmapValues.length - 1} roadmap slotů.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
