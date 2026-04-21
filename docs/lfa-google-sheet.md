# LFA Google Sheet integrace

Google Sheet je zdroj pravdy pro katalog projektů i roadmapu planneru.

## Použité env proměnné

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

Aktuální LFA spreadsheet může být napojen přes ID `12OGL5VJoBwFx0Pj4cGvEz8GwA1_HmKXfwPSQ3ZamkH0`.

## Záložka `Projekty`

Aplikace očekává / případně při synchronizaci zapíše tuto hlavičku:

1. `ID projektu`
2. `Název projektu`
3. `Typ`
4. `Kategorie`
5. `Náročnost`
6. `Dopad`
7. `Čas`
8. `D1`
9. `D2`
10. `D3`
11. `D4`
12. `D5`
13. `D6`
14. `D7`
15. `Owner`
16. `Zdroj`
17. `KPI`
18. `UEFA`
19. `Popis`
20. `Lidé`
21. `Aktivity JSON`
22. `Stav zapracování`
23. `Může do produkce`
24. `Aktualizováno`

Planner i detail projektu čtou katalog projektů přímo z této záložky.

## Záložka `Plany_klubu`

Nově se sem ukládá rozmístění roadmapy 2026–2030.

Doporučený jednoduchý datový model pro současnou appku:

- `Plan ID` — zatím `default`
- `Klub ID` — zatím `LFA`
- `Rok` — 2026 až 2030
- `Slot key` — `L`, `M`, `S1`, `S2`
- `Slot label` — text do UI (`Komplex`, `Standard`, `Easy win 1`, `Easy win 2`)
- `Typ projektu` — validace proti typu projektu (`L`, `M`, `S`)
- `ID projektu` — navázání na záložku `Projekty`
- `Uložil` — např. `LFA admin`
- `Aktualizováno` — ISO timestamp

Tohle je záměrně jednoduché, ale rozšiřitelné:

- `Klub ID` dovolí později přidat více klubů bez změny struktury.
- `Plan ID` dovolí časem přidat varianty plánů nebo scénáře.
- sloty zůstávají stabilní a UI nad nimi může dál fungovat beze změny.

## Chování planneru

- drag & drop roadmapy se ukládá přes `/api/lfa-roadmap`
- po refreshi planner načítá `Plany_klubu` ze serveru
- detail projektu dál zapisuje statusy do `Projekty`
- pokud záložka `Plany_klubu` nebo `Projekty` chybí, serverový kód ji při zápisu/čtení umí založit a zapsat hlavičku

## Seed / import do Sheetu

Pro přepsání záložek `Projekty` a `Plany_klubu` lokálním seedem spusť:

```bash
npm run sync:lfa-sheet
```

Skript připraví kompletní hlavičky a seedne:

- katalog projektů do `Projekty`
- prázdnou roadmapu slotů do `Plany_klubu`
