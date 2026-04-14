import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SigninPanel } from "./_components/SigninPanel";

export default async function SigninPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900 dark:bg-stone-950 dark:text-stone-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <SigninPanel />
      </div>
    </main>
  );
}
