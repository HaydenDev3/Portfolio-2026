import { redirect } from "next/navigation";

export default function ClientInvoicesRedirect() {
  redirect("/dashboard/invoices");
}
