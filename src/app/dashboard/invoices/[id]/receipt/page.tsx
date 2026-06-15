import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true } },
      project: { select: { name: true, tier: true } },
      subscription: { select: { plan: true } },
    },
  });

  if (!invoice) notFound();

  // Auth check
  const isOwner = invoice.clientUserId === session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const amount = (invoice.amount / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
  const gst = ((invoice.amount * 0.1) / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
  const subtotal = ((invoice.amount * 0.9) / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
  const invoiceNum = `INV-${invoice.id.slice(0, 8).toUpperCase()}`;

  return (
    <html>
      <head>
        <style>{`
          @media print { @page { margin: 0.5in; } body { -webkit-print-color-adjust: exact; } }
          body { background: #0a0a0a; color: #f1f5f9; font-family: system-ui, sans-serif; padding: 2rem; }
          .receipt { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.08); }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
          .paid { background: rgba(16,185,129,0.15); color: #34d399; }
          .pending { background: rgba(245,158,11,0.15); color: #fbbf24; }
          .amount { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; }
          table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
          th { text-align: left; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; }
          .total td { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 12px; }
          .footer { margin-top: 2rem; text-align: center; font-size: 11px; color: #64748b; }
          .actions { margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center; }
          .btn { padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #f1f5f9; cursor: pointer; text-decoration: none; }
          .btn-primary { background: white; color: black; border: none; }
        `}</style>
      </head>
      <body>
        <div className="receipt">
          <div className="header">
            <div>
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{siteConfig.name}</h1>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>{invoiceNum}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={`badge ${invoice.status === "PAID" ? "paid" : "pending"}`}>{invoice.status}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Bill To</p>
              <p style={{ margin: "4px 0", fontWeight: 500 }}>{invoice.client?.name || "Client"}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{invoice.client?.email}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Date</p>
              <p style={{ margin: "4px 0", fontWeight: 500 }}>{new Date(invoice.createdAt).toLocaleDateString("en-AU")}</p>
              {invoice.paidAt && (
                <>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "12px 0 0" }}>Paid At</p>
                  <p style={{ margin: "4px 0", fontWeight: 500 }}>{new Date(invoice.paidAt).toLocaleDateString("en-AU")}</p>
                </>
              )}
            </div>
          </div>

          <table>
            <thead>
              <tr><th>Description</th><th style={{ textAlign: "right" }}>Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{invoice.project?.name || "Website Development"}<br />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{invoice.project?.tier || ""} {invoice.subscription?.plan ? `· ${invoice.subscription.plan}` : ""}</span>
                </td>
                <td style={{ textAlign: "right" }}>{subtotal}</td>
              </tr>
              <tr>
                <td style={{ color: "#94a3b8" }}>GST (10%)</td>
                <td style={{ textAlign: "right", color: "#94a3b8" }}>{gst}</td>
              </tr>
              <tr className="total">
                <td>Total</td>
                <td style={{ textAlign: "right" }}>{amount}</td>
              </tr>
            </tbody>
          </table>

          <div className="footer">
            <p>{siteConfig.name} · {siteConfig.email} · {siteConfig.url}</p>
            <p style={{ marginTop: "4px" }}>{invoice.stripePaymentIntentId ? `Payment ID: ${invoice.stripePaymentIntentId}` : "Payment pending"}</p>
          </div>

          <div className="actions" style={{ printColorAdjust: "exact" }}>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print</button>
            <a href="/dashboard/invoices" className="btn">← Back</a>
          </div>
        </div>
      </body>
    </html>
  );
}
