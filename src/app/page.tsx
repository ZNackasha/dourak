import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/schedules");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-zinc-900">
      <div className="max-w-md text-center space-y-8 p-8">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 rotate-3">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Dourak</h1>
          <p className="text-lg text-zinc-500">
            Coordinate volunteers with Google Calendar integration.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-zinc-800 shadow-lg shadow-zinc-200 hover:shadow-xl flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-50 px-2 text-zinc-500">Or continue with email</span>
          </div>
        </div>

        <form
          action={async (formData) => {
            "use server";
            await signIn("email", { email: formData.get("email") });
          }}
          className="space-y-3"
        >
          <input
            type="email"
            name="email"
            placeholder="name@example.com"
            required
            className="w-full rounded-xl border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 transition shadow-sm flex items-center justify-center"
          >
            Sign in with Email
          </button>
        </form>
      </div>
    </div>
  );
}
