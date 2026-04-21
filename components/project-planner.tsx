"use client";

import Link from 'next/link';
import { useMemo, useState, useTransition, type DragEvent } from 'react';
import { logout } from '@/lib/auth-client';
import { ProjectStatusBadges } from '@/components/project-status-badges';
import { createEmptyRoadmapPlan, LFA_ROADMAP_SLOTS, LFA_ROADMAP_YEARS, normalizeRoadmapState } from '@/lib/lfa-roadmap';
import { syncRoadmapToSheet } from '@/lib/lfa-roadmap-client';
import { LFARoadmapSlotKey, LFARoadmapState, LFARoadmapYear, LFAProject, LFAProjectCategory, LFAProjectType } from '@/lib/types';

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

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
  initialPlan: LFARoadmapState;
};

export function ProjectPlanner({ projects, categories, initialPlan }: Props) {
  const [plan, setPlan] = useState<LFARoadmapState>(() => normalizeRoadmapState(initialPlan, projects));
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropzone, setActiveDropzone] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? '');
  const [saveMessage, setSaveMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.label])),
    [categories]
  );

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects]
  );

  const assignedIds = useMemo(
    () =>
      new Set(
        Object.values(plan)
          .flatMap((yearPlan) => Object.values(yearPlan))
          .filter(Boolean) as string[]
      ),
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
    for (const project of filteredProjects) {
      groups[project.type].push(project);
    }
    return groups;
  }, [filteredProjects]);

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

  function buildPlanWithPlacement(projectId: string, year: LFARoadmapYear, slotKey: LFARoadmapSlotKey) {
    const next = structuredClone(plan) as LFARoadmapState;

    for (const planYear of LFA_ROADMAP_YEARS) {
      for (const slot of LFA_ROADMAP_SLOTS) {
        if (next[planYear][slot.key] === projectId) {
          next[planYear][slot.key] = null;
        }
      }
    }

    next[year][slotKey] = projectId;
    return next;
  }

  function getDraggedProject(event?: DragEvent<HTMLElement>) {
    const eventProjectId = event?.dataTransfer?.getData('text/plain') || '';
    const projectId = eventProjectId || draggedId;
    return projectId ? projectMap[projectId] : undefined;
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, year: LFARoadmapYear, slotKey: LFARoadmapSlotKey) {
    event.preventDefault();

    const projectId = event.dataTransfer.getData('text/plain') || draggedId;
    if (!projectId) return;

    const project = projectMap[projectId];
    const slotDef = LFA_ROADMAP_SLOTS.find((slot) => slot.key === slotKey);
    if (!project || !slotDef || slotDef.type !== project.type) return;

    persistPlan(buildPlanWithPlacement(projectId, year, slotKey));
    setSelectedId(projectId);
    setDraggedId(null);
    setActiveDropzone(null);
  }

  function clearSlot(year: LFARoadmapYear, slotKey: LFARoadmapSlotKey) {
    const nextPlan = {
      ...plan,
      [year]: {
        ...plan[year],
        [slotKey]: null
      }
    };

    persistPlan(nextPlan, 'Roadmapa byla aktualizovaná v Google Sheetu.');
  }

  function resetBoard() {
    persistPlan(createEmptyRoadmapPlan(), 'Roadmapa byla resetovaná a uložená do Google Sheetu.');
  }

  function handleLogout() {
    logout();
    window.location.href = '/login';
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
              Každý rok funguje jako plánovací sloupec. Do slotů přiřazuj projekty z katalogu a skládej víceletou ESG roadmapu.
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
          {LFA_ROADMAP_YEARS.map((year) => (
            <article className="yearColumn" key={year}>
              <div className="yearHeading">
                <span className="yearLabel">Sezóna</span>
                <h3>{year}</h3>
              </div>

              <div className="yearSlots">
                {LFA_ROADMAP_SLOTS.map((slot) => {
                  const projectId = plan[year][slot.key];
                  const project = projectId ? projectMap[projectId] : null;
                  const isActive = activeDropzone === `${year}-${slot.key}`;

                  return (
                    <div
                      key={slot.key}
                      className={`timelineSlot ${TYPE_CLASS[slot.type]} ${isActive ? 'isActive' : ''} ${project ? 'hasProject' : ''}`}
                      onDragOver={(event) => {
                        const draggedProject = getDraggedProject(event);
                        if (!draggedProject || draggedProject.type !== slot.type) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setActiveDropzone(`${year}-${slot.key}`);
                      }}
                      onDragLeave={() => setActiveDropzone((current) => (current === `${year}-${slot.key}` ? null : current))}
                      onDrop={(event) => handleDrop(event, year, slot.key)}
                    >
                      <div className="slotTopline">
                        <span>{slot.label}</span>
                        <small>{TYPE_LABEL[slot.type]}</small>
                      </div>

                      {project ? (
                        <button
                          type="button"
                          draggable
                          className={`slotProjectCard ${TYPE_CLASS[project.type]}`}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', project.id);
                            setDraggedId(project.id);
                            setSelectedId(project.id);
                          }}
                          onDragEnd={() => {
                            setDraggedId(null);
                            setActiveDropzone(null);
                          }}
                          onClick={() => setSelectedId(project.id)}
                        >
                          <span className="slotProjectMeta">
                            <span>{project.id}</span>
                            <Link
                              href={`/planner/${encodeURIComponent(project.id)}`}
                              className="slotProjectDetailLink"
                              draggable={false}
                              onClick={(event) => event.stopPropagation()}
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
                              clearSlot(year, slot.key);
                            }}
                          >
                            ×
                          </span>
                        </button>
                      ) : (
                        <div className="slotPlaceholder">Přetáhni projekt sem</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
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
        onDragStart={(event: DragEvent<HTMLAnchorElement>) => {
          if (assigned) return;
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', project.id);
          setDraggedId(project.id);
        }}
        onDragEnd={() => {
          setDraggedId(null);
          setActiveDropzone(null);
        }}
        onClick={(event) => {
          if (draggedId) {
            event.preventDefault();
            return;
          }
          setSelectedId(project.id);
        }}
        className={`catalogChip ${TYPE_CLASS[project.type]} ${assigned ? 'isAssigned' : ''} ${selectedId === project.id ? 'isSelected' : ''}`}
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
