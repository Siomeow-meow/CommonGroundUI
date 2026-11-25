import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BACKEND_URL } from "@/app/lib/backend";

/**
 * Runs once after sign-up / sign-in: makes sure the user has a profile in
 * the CGserver database. The backend takes the id, email and name from the
 * Clerk session and picks a free username, so this only has to call it.
 */
export default async function OnboardingPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/auth/sign-in");

  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}/api/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-3 p-6 text-center">
        <p className="font-semibold">We couldn&apos;t finish setting up your account.</p>
        <p className="text-sm opacity-70">{body?.error ?? `Server error (${res.status})`}</p>
        <a href="/auth/onboarding" className="underline text-sm">
          Try again
        </a>
      </div>
    );
  }

  redirect("/");
}
