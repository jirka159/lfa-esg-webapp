"use client";

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { logout } from '@/lib/auth-client';
import { LFAProject, LFAProjectCategory, LFAProjectType } from '@/lib/types';

const YEARS = [2026, 2027, 2028, 2029, 2030] as const;
const STORAGE_KEY = 'lfa-esg-roadmap-v2';
const SLOT_DEFS = [
  { key: 'L', label: 'Komplex', type: 'L' as const },
  { key: 'M', label: 'Standard', type: 'M' as const },
  { key: 'S1', label: 'Easy win 1', type: 'S' as const },
  { key: 'S2', label: 'Easy win 2', type: 'S' as const }
] as const;

type SlotKey = (typeof SLOT_DEFS)[number]['key'];
type YearPlan = Record<SlotKey, string | null>;
type PlannerState = Record<(typeof YEARS)[number], YearPlan>;

type Props = {
  projects: LFAProject[];
  categories: LFAProjectCategory[];
};

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

function createInitialPlan(): PlannerState {
  return Object.fromEntries(
    YEARS.map((year) => [year, { L: null, M: null, S1: null, S2: null }])
  ) as PlannerState;
}

export function ProjectPlanner({ projects, categories }: Props) {
  const [plan, setPlan] = useState<PlannerState>(createInitialPlan);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropzone, setActiveDropzone] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? '');

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PlannerState;
      if (parsed) setPlan(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

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

  const groupedProjects = useMemo(() => {
    if (activeCategory !== 'all' || query.trim()) return null;
    const groups: Record<string, LFAProject[]> = {};
    for (const project of filteredProjects) {
      groups[project.cat] ||= [];
      groups[project.cat].push(project);
    }
    return groups;
  }, [activeCategory, filteredProjects, query]);

  function handleDrop(year: (typeof YEARS)[number], slotKey: SlotKey) {
    if (!draggedId) return;
    const project = projectMap[draggedId];
    if (!project) return;

    const slotDef = SLOT_DEFS.find((slot) => slot.key === slotKey);
    if (!slotDef || slotDef.type !== project.type) return;

    setPlan((current) => {
      const next = structuredClone(current) as PlannerState;

      for (const planYear of YEARS) {
        for (const key of Object.keys(next[planYear]) as SlotKey[]) {
          if (next[planYear][key] === draggedId) next[planYear][key] = null;
        }
      }

      next[year][slotKey] = draggedId;
      return next;
    });

    setSelectedId(draggedId);
    setDraggedId(null);
    setActiveDropzone(null);
  }

  function clearSlot(year: (typeof YEARS)[number], slotKey: SlotKey) {
    setPlan((current) => ({
      ...current,
      [year]: {
        ...current[year],
        [slotKey]: null
      }
    }));
  }

  function resetBoard() {
    const initial = createInitialPlan();
    setPlan(initial);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <>
      <div className="boardActions boardActionsTop">
        <button className="secondaryButton" type="button" onClick={resetBoard}>
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
          {YEARS.map((year) => (
            <article className="yearColumn" key={year}>
              <div className="yearHeading">
                <span className="yearLabel">Sezóna</span>
                <h3>{year}</h3>
              </div>

              <div className="yearSlots">
                {SLOT_DEFS.map((slot) => {
                  const projectId = plan[year][slot.key];
                  const project = projectId ? projectMap[projectId] : null;
                  const isActive = activeDropzone === `${year}-${slot.key}`;

                  return (
                    <div
                      key={slot.key}
                      className={`timelineSlot ${TYPE_CLASS[slot.type]} ${isActive ? 'isActive' : ''} ${project ? 'hasProject' : ''}`}
                      onDragOver={(event) => {
                        const dragged = draggedId ? projectMap[draggedId] : undefined;
                        if (!dragged || dragged.type !== slot.type) return;
                        event.preventDefault();
                        setActiveDropzone(`${year}-${slot.key}`);
                      }}
                      onDragLeave={() => setActiveDropzone((current) => (current === `${year}-${slot.key}` ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(year, slot.key);
                      }}
                    >
                      <div className="slotTopline">
                        <span>{slot.label}</span>
                        <small>{TYPE_LABEL[slot.type]}</small>
                      </div>

                      {project ? (
                        <button
                          type="button"
                          className={`slotProjectCard ${TYPE_CLASS[project.type]}`}
                          onClick={() => setSelectedId(project.id)}
                        >
                          <span className="slotProjectMeta">{project.id}</span>
                          <strong>{project.name}</strong>
                          <span className="slotProjectCategory">{categoryMap[project.cat]}</span>
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

          <div className="catalogFilters">
            <div className="tabRow">
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

            <div className="searchWrap">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Hledat opatření nebo ID projektu"
              />
            </div>
          </div>

          <div className="catalogList">
            {groupedProjects
              ? Object.entries(groupedProjects).map(([categoryId, categoryProjects]) => (
                  <div key={categoryId} className="catalogGroup">
                    <div className="catalogGroupTitle">{categoryMap[categoryId]}</div>
                    <div className="catalogGroupItems">
                      {categoryProjects.map((project) => renderProjectChip(project))}
                    </div>
                  </div>
                ))
              : filteredProjects.map((project) => renderProjectChip(project))}
          </div>
        </section>
      </section>
    </>
  );

  function renderProjectChip(project: LFAProject) {
    const assigned = assignedIds.has(project.id);
    return (
      <button
        key={project.id}
        type="button"
        draggable={!assigned}
        onDragStart={(event: DragEvent<HTMLButtonElement>) => {
          if (assigned) return;
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', project.id);
          setDraggedId(project.id);
        }}
        onDragEnd={() => {
          setDraggedId(null);
          setActiveDropzone(null);
        }}
        onClick={() => setSelectedId(project.id)}
        className={`catalogChip ${TYPE_CLASS[project.type]} ${assigned ? 'isAssigned' : ''} ${selectedId === project.id ? 'isSelected' : ''}`}
      >
        <span className="catalogChipTop">
          <span className="chipCode">{project.id}</span>
          <span className="chipType">{TYPE_LABEL[project.type]}</span>
        </span>
        <strong>{project.name}</strong>
        <small>{categoryMap[project.cat]}</small>
      </button>
    );
  }
}
