#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { createSign } from 'crypto';

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

function toRow(project) {
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
  const values = [HEADER_ROW, ...projects.map(toRow)];

  await sheetsRequest(
    `values/${encodeURIComponent(`${SHEET_NAME}!A1:X${values.length}`)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ values })
    },
    credentials
  );

  console.log(`Google Sheet synchronizován: ${projects.length} projektů.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
