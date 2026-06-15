import { redirect } from "next/navigation";

export default function ClientSupportRedirect() {
  redirect("/dashboard/tickets");
}
