# LFA Google Sheet integrace

Google Sheet je nově zdroj pravdy pro katalog projektů i detail projektu.

## Použité env proměnné

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

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

Oproti původní minimalistické synchronizaci se tedy tabulka rozšířila z několika statusových sloupců na kompletní datový model projektu, aby planner i detail četly vše přímo z Google Sheetu.

## Zápis z detailu projektu

Detail projektu zapisuje zpět pouze tyto 2 atributy:

- `Stav zapracování`
- `Může do produkce`

Po refreshi se změny znovu načtou z Google Sheetu.

## Seed / import do Sheetu

Pro přepsání záložky `Projekty` lokálním seedem spusť:

```bash
npm run sync:lfa-sheet
```

Skript zapíše kompletní hlavičku i všechny seed projekty do listu `Projekty`.
