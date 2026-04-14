import { redirect } from "next/navigation";

export default async function SigninPage() {
  redirect("/auth/signin");
}
