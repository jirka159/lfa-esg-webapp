import { AuthGuard } from '@/components/auth-guard';
import { ProjectPlannerClient } from '@/components/project-planner-client';
import { lfaProjectCategories } from '@/data/lfa-projects';
import { fetchLfaProjectsFromSheet } from '@/lib/google-sheets-lfa';

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
  const projects = await fetchLfaProjectsFromSheet();

  return (
    <AuthGuard>
      <main className="dashboardPage">
        <header className="brandHero brandHeroRoadmap">
          <div className="brandHeroInner">
            <div className="brandCopy">
              <span className="eyebrow">Ligová fotbalová asociace</span>
              <h1>Katalog ESG projektů</h1>
              <p className="muted">
                Strategický plánovač projektů s časovou osou, drag &amp; drop roky 2026–2030 a katalogem opatření
                převzatým z podkladového ESG katalogu.
              </p>

              <div className="heroRibbon">
                <span>Roadmapa 2026–2030</span>
                <span>Drag &amp; drop plánování</span>
                <span>Projektový detail</span>
              </div>
            </div>

            <aside className="heroScoreboard" aria-label="Souhrn plánování">
              <div className="scoreboardHeader">
                <span className="eyebrow">Planner overview</span>
                <strong>{projects.length} projektů v katalogu</strong>
              </div>
              <div className="scoreboardGrid scoreboardGridStacked">
                <div className="metricCard metricCardFeatured">
                  <span>Roky roadmapy</span>
                  <strong>2026–2030</strong>
                </div>
                <div className="metricCard">
                  <span>Kategorie</span>
                  <strong>{lfaProjectCategories.length}</strong>
                </div>
              </div>
              <div className="scoreboardNote">
                <span className="scorePulse" aria-hidden="true" />
                Krok 1: struktura a plánování projektů
              </div>
            </aside>
          </div>
        </header>

        <ProjectPlannerClient projects={projects} categories={lfaProjectCategories} />
      </main>
    </AuthGuard>
  );
}
