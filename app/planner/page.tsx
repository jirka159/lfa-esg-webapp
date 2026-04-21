import { ProjectPlannerClient } from '@/components/project-planner-client';
import { lfaProjectCategories } from '@/data/lfa-projects';
import { fetchLfaProjectsFromSheet, fetchLfaRoadmapFromSheet } from '@/lib/google-sheets-lfa';
import { requireAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
  const currentUser = await requireAuthenticatedUser();
  const projects = await fetchLfaProjectsFromSheet();
  const initialPlan = await fetchLfaRoadmapFromSheet(
    { planId: currentUser.planId, clubId: currentUser.clubId },
    projects
  );

  return (
    <main className="dashboardPage">
      <header className="brandHero brandHeroRoadmap">
        <div className="brandHeroInner">
          <div className="brandCopy">
            <span className="eyebrow">Ligová fotbalová asociace</span>
            <h1>Katalog ESG projektů</h1>
            <p className="muted">
              Strategický plánovač projektů s časovou osou, drag &amp; drop roky 2026–2030 a společným katalogem
              opatření pro jednotlivé kluby.
            </p>

            <div className="heroRibbon">
              <span>Tým {currentUser.teamName}</span>
              <span>Roadmapa 2026–2030</span>
              <span>Oddělený plán v Google Sheetu</span>
            </div>
          </div>

          <aside className="heroScoreboard" aria-label="Souhrn plánování">
            <div className="scoreboardHeader">
              <span className="eyebrow">Planner overview</span>
              <strong>{projects.length} projektů v katalogu</strong>
            </div>
            <div className="scoreboardGrid scoreboardGridStacked">
              <div className="metricCard metricCardFeatured">
                <span>Přihlášený tým</span>
                <strong>{currentUser.teamName}</strong>
              </div>
              <div className="metricCard">
                <span>Kategorie</span>
                <strong>{lfaProjectCategories.length}</strong>
              </div>
            </div>
            <div className="scoreboardNote">
              <span className="scorePulse" aria-hidden="true" />
              Uživatel {currentUser.username} pracuje s vlastním plánem
            </div>
          </aside>
        </div>
      </header>

      <ProjectPlannerClient
        projects={projects}
        categories={lfaProjectCategories}
        initialPlan={initialPlan}
        currentUser={currentUser}
      />
    </main>
  );
}
