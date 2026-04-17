import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginHero">
        <span className="eyebrow">Pracovní prostor pro ESG plánování</span>
        <h2>Plánujte, prioritizujte a přesouvejte aktivity do roadmapy.</h2>
        <p>
          První MVP pro LFA: jednoduché přihlášení, dashboard plánovače, připravený ESG katalog a drag &amp; drop
          mezi katalogem a plánovanými iniciativami.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
