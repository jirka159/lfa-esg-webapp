import { ProjectPlannerClient } from '@/components/project-planner-client';
import { lfaProjectCategories } from '@/data/lfa-projects';
import { fetchLfaProjectsFromSheet, fetchLfaRoadmapFromSheet } from '@/lib/google-sheets-lfa';
import { requireAuthSessionContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
  const session = await requireAuthSessionContext();
  const projects = await fetchLfaProjectsFromSheet();
  const initialPlan = await fetchLfaRoadmapFromSheet(
    { planId: session.activeTeam.planId, clubId: session.activeTeam.clubId },
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
              <span>Uživatel {session.user.displayName}</span>
              <span>Aktivní tým {session.activeTeam.teamName}</span>
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
                <span>Přihlášený uživatel</span>
                <strong>{session.user.displayName}</strong>
              </div>
              <div className="metricCard">
                <span>Aktivní tým</span>
                <strong>{session.activeTeam.teamName}</strong>
              </div>
              <div className="metricCard">
                <span>Režim</span>
                <strong>{session.user.isAdmin ? 'Administrátor' : 'Týmový účet'}</strong>
              </div>
              <div className="metricCard">
                <span>Kategorie</span>
                <strong>{lfaProjectCategories.length}</strong>
              </div>
            </div>
            <div className="scoreboardNote">
              <span className="scorePulse" aria-hidden="true" />
              Načtená roadmapa odpovídá právě aktivnímu týmu
            </div>
          </aside>
        </div>
      </header>

      <ProjectPlannerClient
        projects={projects}
        categories={lfaProjectCategories}
        initialPlan={initialPlan}
        session={session}
      />
    </main>
  );
}
