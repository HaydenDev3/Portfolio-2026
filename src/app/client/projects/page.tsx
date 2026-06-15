import { redirect } from "next/navigation";

export default function ClientProjectsRedirect() {
  redirect("/dashboard/projects");
}
