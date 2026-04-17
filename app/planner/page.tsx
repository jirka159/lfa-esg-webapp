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
            <p className="muted">Jednoduchý MVP dashboard pro výběr a řazení ESG iniciativ.</p>
          </div>

          <div className="topBarMeta">
            <div className="metricCard">
              <span>V plánu</span>
              <strong>{plannedCount}</strong>
            </div>
            <div className="metricCard">
              <span>Katalog</span>
              <strong>{catalogCount}</strong>
            </div>
          </div>
        </header>

        <section className="summaryStrip">
          <div className="summaryCard">
            <span className="eyebrow">Aktuální fokus</span>
            <h3>ESG roadmapa Q2–Q3 2026</h3>
            <p>Přesouvejte iniciativy mezi katalogem a plánovanou roadmapou pomocí drag &amp; drop nebo akčních tlačítek.</p>
          </div>
          <div className="summaryCard">
            <span className="eyebrow">Režim dat</span>
            <h3>Lokální připravený dataset</h3>
            <p>Připraveno pro rychlé doručení MVP. Napojení na Google Sheet lze doplnit v další iteraci.</p>
          </div>
        </section>

        <PlannerBoard initialActivities={activities} />
      </main>
    </AuthGuard>
  );
}
