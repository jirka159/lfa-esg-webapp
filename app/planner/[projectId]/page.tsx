import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { lfaProjectCategories, lfaProjects } from '@/data/lfa-projects';

export function generateStaticParams() {
  return lfaProjects.map((project) => ({ projectId: project.id }));
}

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

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const project = lfaProjects.find((item) => item.id === decodeURIComponent(params.projectId));
  if (!project) notFound();

  const categoryMap = Object.fromEntries(lfaProjectCategories.map((item) => [item.id, item.label]));

  return (
    <AuthGuard>
      <main className="dashboardPage projectDetailPage">
        <div className="projectDetailShell panelShell">
          <div className="projectDetailTopbar">
            <Link href="/planner" className="secondaryButton projectBackLink">
              ← Zpět do katalogu
            </Link>
            <div className={`detailBadge type${project.type}`}>{TYPE_LABEL[project.type]}</div>
          </div>

          <header className="projectDetailHeader">
            <span className="eyebrow">Detail projektu</span>
            <h1>{project.name}</h1>
            <div className="detailMetaRow">
              <span>{project.id}</span>
              <span>{categoryMap[project.cat]}</span>
              <span>{TIME_LABEL[project.cas]}</span>
            </div>
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
    </AuthGuard>
  );
}
