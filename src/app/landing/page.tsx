import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <section className="flex flex-col gap-5">
        <h1>Страница лендинга</h1>
        <nav>
          <ul>
            <li>
              <Link href="/" className="text-blue-500">
                Главная страница
              </Link>
            </li>
            <li>
              <Link href="/landing" className="text-blue-500">
                Авторизация
              </Link>
            </li>
          </ul>
        </nav>
      </section>
    </main>
  );
}
