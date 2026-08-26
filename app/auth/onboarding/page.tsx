import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser, postUser } from "@/app/lib/user";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const existingUser = await getUser(user.id);

  if (!existingUser) {
    await postUser({
      id: user.id,
      userName:
        user.username || `${user.firstName ?? ""} ${user.lastName ?? ""}`,
      email: user.emailAddresses[0]?.emailAddress,
      fName: user.firstName,
      lName: user.lastName,
      profileImg: user.imageUrl,
    });
  }

  redirect("/");

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );
}
