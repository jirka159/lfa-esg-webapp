import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="loginPage">
      <section className="loginHero">
        <span className="eyebrow">ESG planning workspace</span>
        <h2>LFA ESG Planner MVP</h2>
        <p>
          Static MVP hosted under lfa.jirkovo.app. Continue to the login screen to open the planner.
        </p>
        <div style={{ marginTop: 20 }}>
          <Link className="primaryButton" href="/login">
            Open login
          </Link>
        </div>
      </section>
    </main>
  );
}
