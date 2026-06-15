import { redirect } from "next/navigation";

export default async function ClientProjectDetailRedirect() {
  redirect("/dashboard/projects");
}
