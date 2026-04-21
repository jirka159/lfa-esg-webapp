"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from 'react';
import { logout } from '@/lib/auth-client';
import { ProjectStatusBadges } from '@/components/project-status-badges';
import { createEmptyRoadmapPlan, LFA_ROADMAP_MINIMUM_SECTIONS, LFA_ROADMAP_YEARS, normalizeRoadmapState } from '@/lib/lfa-roadmap';
import { syncRoadmapToSheet } from '@/lib/lfa-roadmap-client';
import { LFARoadmapState, LFARoadmapYear, LFAProject, LFAProjectCategory, LFAProjectType } from '@/lib/types';

const TYPE_LABEL: Record<LFAProjectType, string> = {
  L: 'Komplex',
  M: 'Standard',
  S: 'Easy win'
};

const TYPE_CLASS: Record<LFAProjectType, string> = {
  L: 'typeL',
  M: 'typeM',
  S: 'typeS'
};

const PLANNER_RETURN_KEY = 'lfa-planner-return';

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
};

type DragState = {
  projectId: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  sourceYear?: LFARoadmapYear;
};

export function ProjectPlanner({ projects, categories, initialPlan }: Props) {
  const [plan, setPlan] = useState<LFARoadmapState>(() => normalizeRoadmapState(initialPlan, projects));
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeDropYear, setActiveDropYear] = useState<LFARoadmapYear | null>(null);
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? '');
  const [saveMessage, setSaveMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const restoredScrollRef = useRef(false);
  const suppressClickRef = useRef<string | null>(null);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.label])),
    [categories]
  );

  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);

  const assignedIds = useMemo(
    () => new Set(Object.values(plan).flatMap((yearPlan) => yearPlan).filter(Boolean)),
    [plan]
  );

  const plannedCount = assignedIds.size;
  const availableCount = projects.length - plannedCount;

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const categoryOk = activeCategory === 'all' || project.cat === activeCategory;
      const queryOk =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.id.toLowerCase().includes(normalizedQuery);
      return categoryOk && queryOk;
    });
  }, [activeCategory, projects, query]);

  const groupedByType = useMemo(() => {
    const groups: Record<LFAProjectType, LFAProject[]> = { L: [], M: [], S: [] };
    for (const project of filteredProjects) groups[project.type].push(project);
    return groups;
  }, [filteredProjects]);

  const projectsByYear = useMemo(() => {
    return Object.fromEntries(
      LFA_ROADMAP_YEARS.map((year) => {
        const ids = plan[year] ?? [];
        const grouped: Record<LFAProjectType, LFAProject[]> = { L: [], M: [], S: [] };
        for (const id of ids) {
          const project = projectMap[id];
          if (project) grouped[project.type].push(project);
        }
        return [year, grouped];
      })
    ) as Record<LFARoadmapYear, Record<LFAProjectType, LFAProject[]>>;
  }, [plan, projectMap]);

  useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;

    const raw = window.sessionStorage.getItem(PLANNER_RETURN_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { projectId?: string; scrollY?: number };
      window.sessionStorage.removeItem(PLANNER_RETURN_KEY);
      if (parsed.projectId) {
        setSelectedId(parsed.projectId);
        requestAnimationFrame(() => {
          const target = document.querySelector<HTMLElement>(`[data-project-id="${CSS.escape(parsed.projectId!)}"]`);
          target?.scrollIntoView({ block: 'center', behavior: 'auto' });
          target?.focus?.({ preventScroll: true });
          if (typeof parsed.scrollY === 'number') {
            window.scrollTo({ top: parsed.scrollY, behavior: 'auto' });
          }
        });
      } else if (typeof parsed.scrollY === 'number') {
        window.scrollTo({ top: parsed.scrollY, behavior: 'auto' });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (event: PointerEvent) => {
      setDragState((current) => {
        if (!current) return current;
        if (Math.abs(event.clientX - current.startX) + Math.abs(event.clientY - current.startY) > 4) {
          suppressClickRef.current = current.projectId;
        }
        return { ...current, x: event.clientX, y: event.clientY };
      });
      const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const yearHost = element?.closest<HTMLElement>('[data-drop-year]');
      const year = yearHost?.dataset.dropYear ? Number(yearHost.dataset.dropYear) as LFARoadmapYear : null;
      setActiveDropYear(year && LFA_ROADMAP_YEARS.includes(year) ? year : null);
    };

    const finishDrag = (commit: boolean) => {
      setDragState((current) => {
        if (!current) return current;
        if (commit && activeDropYear) {
          placeProject(current.projectId, activeDropYear);
          setSelectedId(current.projectId);
        }
        return null;
      });
      setActiveDropYear(null);
    };

    const handlePointerUp = () => finishDrag(true);
    const handlePointerCancel = () => finishDrag(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [activeDropYear, dragState]);

  function persistPlan(nextPlan: LFARoadmapState, successMessage = 'Roadmapa byla uložená do Google Sheetu.') {
    const previousPlan = plan;
    const normalizedPlan = normalizeRoadmapState(nextPlan, projects);
    setPlan(normalizedPlan);
    setSaveMessage('Ukládám roadmapu do Google Sheetu…');

    startTransition(async () => {
      try {
        const savedPlan = await syncRoadmapToSheet(normalizedPlan);
        setPlan(normalizeRoadmapState(savedPlan, projects));
        setSaveMessage(successMessage);
      } catch (error) {
        setPlan(previousPlan);
        const message = error instanceof Error ? error.message : 'Nepodařilo se uložit roadmapu.';
        setSaveMessage(message);
      }
    });
  }

  function placeProject(projectId: string, year: LFARoadmapYear) {
    const project = projectMap[projectId];
    if (!project) return;

    const next = structuredClone(plan) as LFARoadmapState;
    for (const planYear of LFA_ROADMAP_YEARS) {
      next[planYear] = (next[planYear] ?? []).filter((id) => id !== projectId);
    }

    const yearProjects = [...(next[year] ?? [])]
      .map((id) => projectMap[id])
      .filter((item): item is LFAProject => Boolean(item));

    const sameTypeBefore = yearProjects.filter((item) => item.type === project.type).length;
    const insertIndex = yearProjects.reduce((acc, item, index) => {
      if (typeWeight(item.type) <= typeWeight(project.type)) return index + 1;
      return acc;
    }, 0);

    const nextIds = yearProjects.map((item) => item.id);
    nextIds.splice(insertIndex, 0, projectId);
    next[year] = nextIds;

    const successMessage =
      sameTypeBefore > 0
        ? 'Roadmapa byla aktualizovaná a projekt se přidal do vybraného roku.'
        : 'Roadmapa byla uložená do Google Sheetu.';

    persistPlan(next, successMessage);
  }

  function clearProject(projectId: string) {
    const nextPlan = Object.fromEntries(
      LFA_ROADMAP_YEARS.map((year) => [year, (plan[year] ?? []).filter((id) => id !== projectId)])
    ) as LFARoadmapState;

    persistPlan(nextPlan, 'Roadmapa byla aktualizovaná v Google Sheetu.');
  }

  function resetBoard() {
    persistPlan(createEmptyRoadmapPlan(), 'Roadmapa byla resetovaná a uložená do Google Sheetu.');
  }

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  function handlePointerDragStart(event: ReactPointerEvent<HTMLElement>, projectId: string, sourceYear?: LFARoadmapYear) {
    if (event.button !== 0) return;
    setDragState({
      projectId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      sourceYear
    });
    setSelectedId(projectId);
  }

  function rememberPlannerPosition(projectId: string) {
    window.sessionStorage.setItem(
      PLANNER_RETURN_KEY,
      JSON.stringify({
        projectId,
        scrollY: window.scrollY
      })
    );
  }

  return (
    <>
      <div className="boardActions boardActionsTop">
        <button className="secondaryButton" type="button" onClick={resetBoard} disabled={isPending}>
          Resetovat roadmapu
        </button>
        <button className="secondaryButton" type="button" onClick={handleLogout}>
          Odhlásit se
        </button>
      </div>

      <section className="timelineSection panelShell">
        <div className="sectionHeading sectionHeadingRoadmap">
          <div>
            <span className="eyebrow">Roadmapa 2026–2030</span>
            <h2>Strategický board priorit LFA</h2>
            <p className="sectionLead">
              Projekty stačí přetáhnout na sloupec roku. Planner je automaticky zařadí do správné sekce podle
              komplexity a dovolí přidat více aktivit stejného typu.
            </p>
            {saveMessage ? <p className="syncMessage">{saveMessage}</p> : null}
          </div>
          <div className="timelineStats">
            <div className="miniStat">
              <span>Naplánováno</span>
              <strong>{plannedCount}</strong>
            </div>
            <div className="miniStat">
              <span>Volné v katalogu</span>
              <strong>{availableCount}</strong>
            </div>
          </div>
        </div>

        <div className="roadmapLegend">
          <div className="roadmapLegendLabel">Plánovací vrstvy</div>
          <div className="roadmapLegendItems">
            <span className="legendPill typeL">Komplex</span>
            <span className="legendPill typeM">Standard</span>
            <span className="legendPill typeS">Easy win</span>
          </div>
        </div>

        <div className="timelineGrid">
          {LFA_ROADMAP_YEARS.map((year) => {
            const grouped = projectsByYear[year];
            const isActive = activeDropYear === year;

            return (
              <article className={`yearColumn ${isActive ? 'isActive' : ''}`} key={year} data-drop-year={year}>
                <div className="yearHeading">
                  <span className="yearLabel">Sezóna</span>
                  <h3>{year}</h3>
                </div>

                <div className={`yearSections ${isActive ? 'isActive' : ''}`}>
                  {LFA_ROADMAP_MINIMUM_SECTIONS.map((type) => {
                    const yearProjectsOfType = grouped[type];
                    return (
                      <section className={`timelineGroup ${TYPE_CLASS[type]}`} key={`${year}-${type}`}>
                        <div className="slotTopline timelineGroupHeading">
                          <span>{TYPE_LABEL[type]}</span>
                          <small>{yearProjectsOfType.length || '0'}×</small>
                        </div>

                        <div className="timelineGroupBody">
                          {yearProjectsOfType.length ? (
                            yearProjectsOfType.map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                className={`slotProjectCard ${TYPE_CLASS[project.type]} ${selectedId === project.id ? 'isSelected' : ''}`}
                                onPointerDown={(event) => handlePointerDragStart(event, project.id, year)}
                                onClick={() => setSelectedId(project.id)}
                                data-project-id={project.id}
                              >
                                <span className="slotProjectMeta">
                                  <span>{project.id}</span>
                                  <Link
                                    href={`/planner/${encodeURIComponent(project.id)}`}
                                    className="slotProjectDetailLink"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      rememberPlannerPosition(project.id);
                                    }}
                                  >
                                    Detail →
                                  </Link>
                                </span>
                                <strong>{project.name}</strong>
                                <span className="slotProjectCategory">{categoryMap[project.cat]}</span>
                                <ProjectStatusBadges project={project} compact />
                                <span
                                  className="slotRemove"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    clearProject(project.id);
                                  }}
                                >
                                  ×
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="slotPlaceholder">Přetáhni projekt kamkoliv do sloupce roku</div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="plannerLayout">
        <section className="catalogPanel panelShell">
          <div className="sectionHeading">
            <div>
              <span className="eyebrow">Katalog opatření</span>
              <h2>Projekty z podkladového Excelu</h2>
            </div>
            <div className="panelStatBadge">{projects.length} projektů</div>
          </div>

          <div className="catalogWorkspace">
            <aside className="catalogSidebar">
              <div className="searchWrap">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Hledat opatření nebo ID projektu"
                />
              </div>

              <div className="catalogSidebarBlock">
                <div className="catalogSidebarTitle">Filtr kategorií</div>
                <div className="tabRow tabColumn">
                  <button
                    type="button"
                    className={`filterPill ${activeCategory === 'all' ? 'isActive' : ''}`}
                    onClick={() => setActiveCategory('all')}
                  >
                    Vše
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`filterPill ${activeCategory === category.id ? 'isActive' : ''}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="catalogList catalogListByType">
              {(['L', 'M', 'S'] as LFAProjectType[]).map((type) => (
                <section key={type} className="typeColumnWrap">
                  <div className={`typeColumnHeader ${TYPE_CLASS[type]}`}>
                    <span>{TYPE_LABEL[type]}</span>
                    <strong>{groupedByType[type].length}</strong>
                  </div>
                  <div className="typeColumnBody">
                    {groupedByType[type].map((project) => renderProjectChip(project))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </section>

      {dragState ? renderDragOverlay() : null}
    </>
  );

  function renderProjectChip(project: LFAProject) {
    const assigned = assignedIds.has(project.id);
    return (
      <Link
        key={project.id}
        href={`/planner/${encodeURIComponent(project.id)}`}
        onPointerDown={(event) => {
          if (assigned) return;
          handlePointerDragStart(event, project.id);
        }}
        onClick={(event) => {
          if (suppressClickRef.current === project.id) {
            event.preventDefault();
            suppressClickRef.current = null;
            return;
          }
          rememberPlannerPosition(project.id);
          setSelectedId(project.id);
        }}
        className={`catalogChip ${TYPE_CLASS[project.type]} ${assigned ? 'isAssigned' : ''} ${selectedId === project.id ? 'isSelected' : ''}`}
        data-project-id={project.id}
      >
        <span className="catalogChipTop">
          <span className="chipCode">{project.id}</span>
          <span className="chipType">{TYPE_LABEL[project.type]}</span>
        </span>
        <strong>{project.name}</strong>
        <small>{categoryMap[project.cat]}</small>
        <ProjectStatusBadges project={project} compact />
      </Link>
    );
  }

  function renderDragOverlay() {
    const project = projectMap[dragState!.projectId];
    if (!project) return null;

    const movedEnough = Math.abs(dragState!.x - dragState!.startX) + Math.abs(dragState!.y - dragState!.startY) > 4;
    if (!movedEnough) return null;

    return (
      <div className="plannerDragLayer" aria-hidden="true">
        <div
          className={`plannerDragPreview ${TYPE_CLASS[project.type]}`}
          style={{ transform: `translate(${dragState!.x + 18}px, ${dragState!.y + 18}px)` }}
        >
          <span>{project.id}</span>
          <strong>{project.name}</strong>
          <small>{TYPE_LABEL[project.type]} · {categoryMap[project.cat]}</small>
        </div>
      </div>
    );
  }
}

function typeWeight(type: LFAProjectType) {
  return type === 'L' ? 0 : type === 'M' ? 1 : 2;
}
