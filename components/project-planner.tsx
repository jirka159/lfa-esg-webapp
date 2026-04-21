"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from 'react';
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

export function ProjectPlanner({ projects, categories, initialPlan }: Props) {
  const [plan, setPlan] = useState<LFARoadmapState>(() => normalizeRoadmapState(initialPlan, projects));
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [dragProjectId, setDragProjectId] = useState<string | null>(null);
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

  function handleNativeDragStart(event: DragEvent<HTMLElement>, projectId: string) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', projectId);
    event.dataTransfer.setData('application/x-lfa-project-id', projectId);
    setDragProjectId(projectId);
    setSelectedId(projectId);
    suppressClickRef.current = projectId;
  }

  function handleNativeDragEnd() {
    setDragProjectId(null);
    setActiveDropYear(null);
  }

  function handleYearDragOver(event: DragEvent<HTMLElement>, year: LFARoadmapYear) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (activeDropYear !== year) setActiveDropYear(year);
  }

  function handleYearDragLeave(event: DragEvent<HTMLElement>, year: LFARoadmapYear) {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    setActiveDropYear((current) => (current === year ? null : current));
  }

  function handleYearDrop(event: DragEvent<HTMLElement>, year: LFARoadmapYear) {
    event.preventDefault();
    const projectId =
      event.dataTransfer.getData('application/x-lfa-project-id') || event.dataTransfer.getData('text/plain');
    setActiveDropYear(null);
    setDragProjectId(null);
    if (!projectId) return;
    placeProject(projectId, year);
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
              <article
                className={`yearColumn ${isActive ? 'isActive' : ''}`}
                key={year}
                data-drop-year={year}
                onDragOver={(event) => handleYearDragOver(event, year)}
                onDragEnter={(event) => handleYearDragOver(event, year)}
                onDragLeave={(event) => handleYearDragLeave(event, year)}
                onDrop={(event) => handleYearDrop(event, year)}
              >
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
                                draggable
                                onDragStart={(event) => handleNativeDragStart(event, project.id)}
                                onDragEnd={handleNativeDragEnd}
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

    </>
  );

  function renderProjectChip(project: LFAProject) {
    const assigned = assignedIds.has(project.id);
    return (
      <Link
        key={project.id}
        href={`/planner/${encodeURIComponent(project.id)}`}
        draggable={!assigned}
        onDragStart={(event) => {
          if (assigned) {
            event.preventDefault();
            return;
          }
          handleNativeDragStart(event, project.id);
        }}
        onDragEnd={handleNativeDragEnd}
        onClick={(event) => {
          if (suppressClickRef.current === project.id) {
            event.preventDefault();
            suppressClickRef.current = null;
            return;
          }
          rememberPlannerPosition(project.id);
          setSelectedId(project.id);
        }}
        className={`catalogChip ${TYPE_CLASS[project.type]} ${assigned ? 'isAssigned' : ''} ${selectedId === project.id ? 'isSelected' : ''} ${dragProjectId === project.id ? 'isDragging' : ''}`}
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
}

function typeWeight(type: LFAProjectType) {
  return type === 'L' ? 0 : type === 'M' ? 1 : 2;
}
