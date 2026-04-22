"use client";

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { lfaProjectCategories } from '@/data/lfa-projects';
import { LFAProject, LFAProjectStatusUpdate } from '@/lib/types';
import { LFA_ZAPRACOVANI_OPTIONS, syncProjectStatusToSheet } from '@/lib/lfa-project-status';
import { ProjectStatusBadges } from '@/components/project-status-badges';
import { type AuthSessionContext } from '@/lib/auth';
import { TeamSwitcher } from '@/components/team-switcher';

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

function scoreLabel(score: number) {
  if (score >= 4) return 'Vysoká';
  if (score >= 3) return 'Střední';
  return 'Nižší';
}

export function ProjectDetailClient({ project, session }: { project: LFAProject; session: AuthSessionContext }) {
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
            <span className="detailLabel">Owner / realizace</span>
            <p>{project.owner || 'Bude doplněno'}</p>
          </div>

          <div className="detailBlock">
            <span className="detailLabel">Navrhované KPI</span>
            <p>{project.kpi || 'Bude doplněno v dalším kroku.'}</p>
          </div>

          <div className="detailBlock">
            <span className="detailLabel">Zdroj inspirace</span>
            <p>{project.zdroj || 'Katalog LFA'}</p>
          </div>

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
        </section>
      </div>
    </main>
  );
}
