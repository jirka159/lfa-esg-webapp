import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <main className="loginPage">
      <section className="loginHero">
        <span className="eyebrow">ESG planning workspace</span>
        <h2>Plan, prioritise and move activities into the roadmap.</h2>
        <p>
          First MVP for LFA: simple login, planner dashboard, seeded ESG catalog and drag & drop
          between catalog and planned initiatives.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}
