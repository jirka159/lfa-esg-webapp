# LFA ESG Planner MVP

První MVP webové aplikace pro `lfa-esg-webapp` postavené v **Next.js + TypeScript**.

Cílové nasazení: **https://lfa.jirkovo.app**

## Co je hotové

- login page pro MVP
- jednoduchá session přes HTTP-only cookie
- planner/dashboard layout
- horní sekce plánovaných ESG aktivit
- spodní katalog ESG aktivit
- přesun aktivit mezi katalogem a plánem:
  - drag & drop
  - fallback přes tlačítka
- lokální seed/mock data
- základní API routes:
  - `POST /api/login`
  - `POST /api/logout`
  - `GET /api/session`
  - `GET /api/activities`
- připravené podklady pro vlastní hosting pod `lfa.jirkovo.app`

## MVP přihlašovací údaje

- uživatel: `LFA Admin`
- heslo: `heslo`

## Zdroj dat

Aktuálně aplikace používá lokální seed data v `data/activities.ts`.

Google Sheet pro další iteraci:

- https://docs.google.com/spreadsheets/d/12OGL5VJoBwFx0Pj4cGvEz8GwA1_HmKXfwPSQ3ZamkH0/edit

Placeholdery pro budoucí integraci jsou v `.env.example`.

## Lokální spuštění

```bash
npm install
npm run dev
```

Pak otevři:

- http://localhost:3000

## Produkční build

```bash
npm install
npm run build
npm run start
```

Aplikace poběží jako Node server, což je vhodné i pro nasazení za reverse proxy na `lfa.jirkovo.app`.

## Doporučené nasazení na vlastní hosting

### Varianta A: Node runtime + reverse proxy

Tohle je pro Next.js MVP nejpraktičtější varianta.

1. Naklonovat nebo nasadit repo na server, např. do:
   - `/var/www/lfa-esg-webapp`
2. Vytvořit `.env.production.local` podle `.env.example`
3. Nainstalovat závislosti:

```bash
npm install
```

4. Postavit aplikaci:

```bash
npm run build
```

5. Spustit aplikaci:

```bash
PORT=3000 APP_URL=https://lfa.jirkovo.app npm run start
```

6. Přesměrovat subdoménu `lfa.jirkovo.app` přes reverse proxy na `127.0.0.1:3000`

Ukázka konfigurace je v:

- `deploy/nginx.lfa.jirkovo.app.conf.example`

### Varianta B: PM2

Pro trvalý běh procesu je připravené:

- `deploy/ecosystem.config.cjs`

Příklad:

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

> Před použitím uprav `cwd` v `deploy/ecosystem.config.cjs` podle skutečné cesty na serveru.

## Poznámky k doméně `lfa.jirkovo.app`

- v produkci nastav `APP_URL=https://lfa.jirkovo.app`
- pokud bude použité HTTPS terminované na reverse proxy, aplikace může běžet lokálně na HTTP portu 3000
- cookie je v produkci nastavena jako `secure`
- pokud bude hosting za Nginx/Apache, je důležité předávat `Host` a `X-Forwarded-Proto`

## Struktura projektu

- `app/` – Next.js App Router
- `components/` – UI komponenty
- `data/activities.ts` – seed/mock data
- `lib/` – typy a auth pomocné funkce
- `deploy/` – podklady pro deployment

## Co ještě zbývá po MVP

- napojení na Google Sheets místo lokálních seed dat
- persistentní ukládání změn plánu
- lepší autentizace než pevné MVP heslo
- filtrování, štítky, priority, termíny a detail aktivit
- produkční hardening a monitoring

## Poznámka

Tato verze je záměrně jednoduchý, hezký a rychle spustitelný základ pro další iteraci.
