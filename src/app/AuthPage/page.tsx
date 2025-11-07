import Link from "next/link";

export default function AuthPage() {
  return (
    <main>
      <section className="flex flex-col gap-5">
        <h1>Страница входа</h1>
        <nav>
          <ul>
            <li>
              <Link href="/" className="text-blue-500">
                Главная страница
              </Link>
            </li>
            <li>
              <Link href="/LandingPage" className="text-blue-500">
                Лендинг
              </Link>
            </li>
          </ul>
        </nav>
      </section>
    </main>
  );
}
