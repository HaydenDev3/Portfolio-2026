import { redirect } from "next/navigation";

export default async function ClientTicketDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/tickets/${id}`);
}
