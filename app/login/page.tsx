import LoginForm from "./login-form";

export const metadata = { title: "Вхід — Наш бюджет" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="w-full max-w-sm rise">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
            💜
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Наш бюджет</h1>
          <p className="mt-1.5 text-sm text-muted">Тільки для нас двох</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
