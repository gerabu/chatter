"use client";

import { signIn } from "next-auth/react";

type Provider = "github" | "google";

async function authenticate(provider: Provider) {
  await signIn(provider, { callbackUrl: "/app" });
}

export function SigninPanel() {
  return (
    <section className="w-full max-w-md rounded-2xl border border-stone-300 bg-white/90 p-6 shadow-sm dark:border-stone-700 dark:bg-stone-900/90">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Sign in</h1>
      </div>

      <p className="mb-5 text-sm text-stone-600 dark:text-stone-300">
        Continue with your existing account to access your tasks, notes, and events.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => authenticate("google")}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-sm font-semibold text-stone-900 transition hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => authenticate("github")}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          Continue with GitHub
        </button>
      </div>
    </section>
  );
}
