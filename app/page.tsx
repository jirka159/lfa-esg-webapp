import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="loginPage">
      <section className="loginHero">
        <span className="eyebrow">Pracovní prostor pro ESG plánování</span>
        <h2>LFA ESG Planner MVP</h2>
        <p>
          Statické MVP nasazené pod lfa.jirkovo.app. Pokračujte na přihlašovací obrazovku a otevřete plánovač.
        </p>
        <div style={{ marginTop: 20 }}>
          <Link className="primaryButton" href="/login">
            Otevřít přihlášení
          </Link>
        </div>
      </section>
    </main>
  );
}
