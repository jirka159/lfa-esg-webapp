"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { lfaProjectCategories } from '@/data/lfa-projects';
import { LFAProject, LFAProjectStatusUpdate } from '@/lib/types';
import { LFA_ZAPRACOVANI_OPTIONS, syncProjectStatusToSheet } from '@/lib/lfa-project-status';
import { ProjectStatusBadges } from '@/components/project-status-badges';
import { TeamSwitcher } from '@/components/team-switcher';

type ClientSessionUser = {
  id: string;
  username: string;
  displayName: string;
  teamName: string;
  clubId: string;
  planId: string;
  isAdmin?: boolean;
};

type DetailSession = {
  user: ClientSessionUser;
  activeTeam: ClientSessionUser;
  availableTeams: ClientSessionUser[];
};

const TYPE_LABEL = {
  L: 'Komplex',
  M: 'Standard',
  S: 'Easy win'
} as const;

const TIME_LABEL = {
  S: 'Krátkodobé (< 6 měsíců)',
  M: 'Střednědobé (6–12 měsíců)',
  L: 'Dlouhodobé (12+ měsíců)'
} as const;

const STATUS_LABEL = {
  hotovo: 'hotovo',
  probiha: 'probíhá',
  plan: 'naplánováno'
} as const;

const CARBON_PROJECT_NAME = 'Uhlíková stopa organizace';

function scoreLabel(score: number) {
  if (score >= 4) return 'Vysoká';
  if (score >= 3) return 'Střední';
  return 'Nižší';
}

export function ProjectDetailClient({ project, session }: { project: LFAProject; session: DetailSession }) {
  const categoryMap = useMemo(
    () => Object.fromEntries(lfaProjectCategories.map((item) => [item.id, item.label])),
    []
  );
  const [formState, setFormState] = useState<LFAProjectStatusUpdate>({
    id: project.id,
    stavZapracovani: project.stavZapracovani,
    muzeDoProdukce: project.muzeDoProdukce
  });
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFormState({
      id: project.id,
      stavZapracovani: project.stavZapracovani,
      muzeDoProdukce: project.muzeDoProdukce
    });
    setSaveMessage('');
  }, [project.id, project.stavZapracovani, project.muzeDoProdukce, session.activeTeam.id]);

  function handleSave() {
    setSaveMessage('');
    startTransition(async () => {
      try {
        await syncProjectStatusToSheet(formState);
        setSaveMessage('Změny byly uložené do Google Sheetu. Po refreshi se načtou z něj.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nepodařilo se uložit změny.';
        setSaveMessage(message);
      }
    });
  }

  const effectiveProject = { ...project, ...formState };
  const isCarbonGuide = project.name === CARBON_PROJECT_NAME;

  return (
    <main className="dashboardPage projectDetailPage">
      <div className="projectDetailShell panelShell">
        <div className="projectDetailTopbar">
          <Link href="/planner" className="secondaryButton projectBackLink">
            ← Zpět do katalogu
          </Link>
          <div className="detailTopbarMeta">
            <div className="teamContextCard isCompact">
              <span className="eyebrow">Přihlášený uživatel</span>
              <strong>{session.user.displayName}</strong>
              <small>
                Aktivní tým {session.activeTeam.teamName} · účet {session.user.username}
              </small>
            </div>
            <div className={`detailBadge type${project.type}`}>{TYPE_LABEL[project.type]}</div>
          </div>
        </div>

        <TeamSwitcher
          currentUser={session.user}
          activeTeam={session.activeTeam}
          availableTeams={session.availableTeams}
        />

        <header className="projectDetailHeader">
          <span className="eyebrow">Detail projektu</span>
          <h1>{project.name}</h1>
          <div className="detailMetaRow">
            <span>{project.id}</span>
            <span>{categoryMap[project.cat]}</span>
            <span>{TIME_LABEL[project.cas]}</span>
            <span>Tým {session.activeTeam.teamName}</span>
          </div>
          <ProjectStatusBadges project={effectiveProject} />
        </header>

        <section className="projectDetailGrid">
          <div className="detailIntro">
            <p>{project.popis}</p>
          </div>

          {isCarbonGuide ? (
            <>
              <div className="detailBlock detailBlockWide guideHeroBlock">
                <span className="detailLabel">Detail projektu</span>
                <h2>Uhlíková stopa organizace</h2>
                <p>
                  <strong>Kategorie:</strong> 8.1 Klima a infrastruktura · <strong>Časový rámec:</strong> ≤ 6 měsíců ·{' '}
                  <strong>Tým:</strong> 2 lidé v klubu
                </p>
                <div className="guideIntroDocs">
                  <span className="guideIntroDocsLabel">Úvodní podklady</span>
                  <div className="guideProcessDocs">
                    <span>Dokumenty:</span>
                    <span>Příloha 5 — Teaser pro vedení</span>
                    <span>Příloha 3 — Checklist koordinátora</span>
                  </div>
                </div>
              </div>

              <div className="detailBlock detailBlockWide">
                <span className="detailLabel">1. Co projekt přinese</span>
                <p>
                  Klub získá první oficiální výpočet uhlíkové stopy ve Scope 1, 2 a 3, výchozí rok pro budoucí
                  srovnání, dekarbonizační cíl a publikovatelný report. Výstup je v souladu s GHG Protocol a
                  metodikou UEFA — tedy připravený pro budoucí licenční požadavky i ESG očekávání partnerů a sponzorů.
                </p>
              </div>

              <div className="detailBlock detailBlockWide">
                <span className="detailLabel">2. Role v projektu</span>
                <div className="guideTable">
                  <div className="guideTableHead">Role</div>
                  <div className="guideTableHead">Kdo</div>
                  <div className="guideTableHead">Co dělá</div>

                  <div>Sponzor</div>
                  <div>Vedení klubu</div>
                  <div>Schvaluje cíle a rozpočet</div>

                  <div>Koordinátor</div>
                  <div>Provozní manažer klubu</div>
                  <div>Otevírá přístup k datům, řídí termíny</div>

                  <div>Datový kontakt</div>
                  <div>Ekonom / správa stadionu</div>
                  <div>Dodává faktury a spotřeby</div>

                  <div>Odborná podpora</div>
                  <div>Volitelně externí partner (např. Greenometer)</div>
                  <div>Metodika, výpočet, validace a report v případě potřeby podpory</div>
                </div>
                <p>
                  Výpočet uhlíkové stopy není administrativní úkon — vyžaduje znalost GHG Protocol, správnou volbu
                  emisních faktorů, zacházení se Scope 3 a soulad s vyvíjející se regulací (CSRD/VSME, UEFA). Klub
                  dodává data; pokud si klub nebude vědět rady, může využít externí odbornou podporu.
                </p>
              </div>

              <div className="detailBlock detailBlockWide">
                <span className="detailLabel">3. Rozpad aktivit</span>
                <div className="guideSteps">
                  <div className="guideStep"><strong>1. Kick-off a nastavení hranic projektu</strong><p>Potvrzení cíle, výchozího roku, odpovědností a rozsahu Scope 1, 2 a 3. V této fázi je důležité sladit očekávání vedení, provozu i ekonomického týmu.</p><div className="guideProcessDocs"><span>Časová osa:</span><span>1. týden</span></div></div>
                  <div className="guideStep"><strong>2. Sběr dat pro Scope 1 a 2</strong><p>Klub připraví spotřeby a faktury za energie, teplo, paliva a další přímé zdroje emisí. Cílem je rychle získat kompletní a konzistentní datový základ.</p><div className="guideProcessDocs"><span>Časová osa:</span><span>2.–3. týden</span></div><div className="guideProcessDocs"><span>Příloha:</span><span>Příloha 1 — Šablona sběru dat Scope 1 a 2</span></div></div>
                  <div className="guideStep"><strong>3. Sběr dat pro Scope 3</strong><p>Mapují se nepřímé emise, zejména doprava týmu, dojíždění zaměstnanců, odpad a doprava fanoušků. U fanoušků je vhodné použít strukturovaný dotazník a interní kontrolní checklist.</p><div className="guideProcessDocs"><span>Časová osa:</span><span>3.–5. týden</span></div><div className="guideProcessDocs"><span>Přílohy:</span><span>Příloha 2 — Dotazník pro fanoušky</span><span>Příloha 6 — Dotazník Scope 3</span></div></div>
                  <div className="guideStep"><strong>4. Výpočet, validace a kontrola výsledků</strong><p>Po doplnění vstupů následuje výpočet, ověření hlavních čísel a kontrola metodických předpokladů. V případě potřeby lze přizvat odbornou podporu pro validaci a interpretaci výsledků.</p><div className="guideProcessDocs"><span>Časová osa:</span><span>5.–6. týden</span></div></div>
                  <div className="guideStep"><strong>5. Report, cíle a komunikace výsledků</strong><p>Výstupem je publikovatelný report, návrh dekarbonizačního cíle a podklady pro interní i externí komunikaci. Klub může výstup použít vůči partnerům, sponzorům i směrem k UEFA.</p><div className="guideProcessDocs"><span>Časová osa:</span><span>6.–8. týden</span></div><div className="guideProcessDocs"><span>Příloha:</span><span>Příloha 4 — Struktura reportu</span></div></div>
                </div>
              </div>

              <div className="detailBlock detailBlockWide">
                <span className="detailLabel">4. Doporučená KPI</span>
                <div className="guideTable guideTableKpi">
                  <div className="guideTableHead">KPI</div>
                  <div className="guideTableHead">Jednotka</div>
                  <div className="guideTableHead">K čemu slouží</div>

                  <div>Celkové emise</div>
                  <div>tCO₂e</div>
                  <div>Hlavní ukazatel</div>

                  <div>Emise na diváka</div>
                  <div>kg CO₂e/divák</div>
                  <div>UEFA standard pro benchmarking</div>

                  <div>Emise na zaměstnance</div>
                  <div>tCO₂e/FTE</div>
                  <div>Srovnání s jinými organizacemi</div>

                  <div>% redukce r/r</div>
                  <div>%</div>
                  <div>Sledování pokroku k cíli</div>

                  <div>Podíl OZE ve Scope 2</div>
                  <div>%</div>
                  <div>Ukazatel zelené tranzice</div>
                </div>
                <p>
                  Orientační benchmarky z evropských klubů: emise na diváka 5–15 kg CO₂e; doprava fanoušků tvoří
                  60–80 % celkové stopy. Inspirace: FC Viktoria Plzeň, FK Pardubice — kluby, které mají uhlíkovou
                  stopu zveřejněnou a používají ji v komunikaci se sponzory.
                </p>
              </div>

              <div className="detailBlock detailBlockWide">
                <span className="detailLabel">Šablona a přílohy</span>
                <div className="guideAttachmentBox">
                  <div>
                    <strong>Přílohy ke stažení a k použití v projektu</strong>
                    <p>Sem bude možné přiložit soubor od klubu. Níže budou dostupné šablony a podklady pro jednotlivé kroky projektu.</p>
                  </div>
                  <div className="guideAttachmentActions">
                    <label className="secondaryButton uploadButton">
                      Přiložit soubor
                      <input type="file" hidden />
                    </label>
                  </div>
                </div>
                <div className="guideFilesList">
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-1-sablona-sber-dat-scope-1-2.docx" download><strong>Priloha 1</strong><span>Šablona sběru dat Scope 1 a 2</span></a>
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-2-dotaznik-pro-fanousky.docx" download><strong>Priloha 2</strong><span>Dotazník pro fanoušky</span></a>
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-3-checklist-koordinator.docx" download><strong>Priloha 3</strong><span>Checklist koordinátora</span></a>
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-4-struktura-reportu.docx" download><strong>Priloha 4</strong><span>Struktura reportu</span></a>
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-5-teaser-pro-vedeni.docx" download><strong>Priloha 5</strong><span>Teaser pro vedení</span></a>
                  <a className="guideFileItem" href="/attachments/carbon-footprint/priloha-6-dotaznik-scope-3.docx" download><strong>Priloha 6</strong><span>Dotazník Scope 3</span></a>
                </div>
              </div>
            </>
          ) : null}

          <div className="detailMetrics">
            <div className="metricTile">
              <span>Dopad</span>
              <strong>{project.dopad.toFixed(2)}</strong>
            </div>
            <div className="metricTile">
              <span>Náročnost</span>
              <strong>{scoreLabel(project.narocnost)}</strong>
            </div>
            <div className="metricTile">
              <span>Lidé</span>
              <strong>{project.lide ?? '—'}</strong>
            </div>
          </div>

          <div className="detailBlock statusEditorBlock detailBlockWide">
            <span className="detailLabel">Řízení stavu projektu</span>
            <div className="statusEditorGrid">
              <label className="field">
                <span>Stav</span>
                <select
                  value={formState.stavZapracovani}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      stavZapracovani: event.target.value as LFAProject['stavZapracovani']
                    }))
                  }
                >
                  {LFA_ZAPRACOVANI_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="checkboxField">
                <input
                  type="checkbox"
                  checked={formState.muzeDoProdukce}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      muzeDoProdukce: event.target.checked
                    }))
                  }
                />
                <span>Publikovat</span>
              </label>
            </div>

            <div className="statusEditorActions">
              <button className="primaryButton" type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Ukládám…' : 'Uložit změny'}
              </button>
              {saveMessage ? <p className="syncMessage">{saveMessage}</p> : null}
            </div>
          </div>

          <div className="detailBlock">
            <span className="detailLabel">Zdroj inspirace</span>
            <p>{project.zdroj || 'Katalog LFA'}</p>
          </div>

          {!isCarbonGuide ? (
            <div className="detailBlock detailBlockWide">
              <span className="detailLabel">Rozpad aktivit</span>
              {project.aktivity?.length ? (
                <div className="activityChecklist">
                  {project.aktivity.map((activity) => (
                    <div className="activityChecklistItem" key={activity.name}>
                      <span className={`checkDot ${activity.status}`}></span>
                      <div>
                        <strong>{activity.name}</strong>
                        <small>{STATUS_LABEL[activity.status]}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Zde v kroku 2 doplníme plný detail projektu a rozpad implementace.</p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
