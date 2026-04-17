import { activities } from '@/data/activities';
import { PlannerBoard } from '@/components/planner-board';
import { AuthGuard } from '@/components/auth-guard';

export default function PlannerPage() {
  const plannedCount = activities.filter((item) => item.planned).length;
  const catalogCount = activities.length - plannedCount;

  return (
    <AuthGuard>
      <main className="dashboardPage">
        <header className="topBar">
          <div>
            <span className="eyebrow">lfa.jirkovo.app</span>
            <h1>LFA ESG Planner</h1>
            <p className="muted">Simple MVP dashboard for selecting and sequencing ESG initiatives.</p>
          </div>

          <div className="topBarMeta">
            <div className="metricCard">
              <span>Planned</span>
              <strong>{plannedCount}</strong>
            </div>
            <div className="metricCard">
              <span>Catalog</span>
              <strong>{catalogCount}</strong>
            </div>
          </div>
        </header>

        <section className="summaryStrip">
          <div className="summaryCard">
            <span className="eyebrow">Current focus</span>
            <h3>Q2–Q3 2026 ESG roadmap</h3>
            <p>Use drag & drop or action buttons to move initiatives between the catalog and planned roadmap.</p>
          </div>
          <div className="summaryCard">
            <span className="eyebrow">Data mode</span>
            <h3>Local seeded dataset</h3>
            <p>Prepared for fast MVP delivery. Google Sheet connection can be added in the next iteration.</p>
          </div>
        </section>

        <PlannerBoard initialActivities={activities} />
      </main>
    </AuthGuard>
  );
}
