import Link from "next/link";
import { FileText } from "lucide-react";
import { DocumentForm } from "@/components/admin/document-form";
import { PaymentForm } from "@/components/admin/payment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDocumentBookingOptions, getDocumentRegister } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";

const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });

export default async function AdminDocuments() {
  await requireRole(["owner", "admin"]);
  const [documents, bookings] = await Promise.all([
    getDocumentRegister(),
    getDocumentBookingOptions(),
  ]);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Documents and payments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Issue snapshot-based quotes, invoices, and receipts, then record guest payments.
        </p>
      </header>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Create document</h2>
        <DocumentForm bookings={bookings} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Record payment</h2>
        <PaymentForm bookings={bookings} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Document register</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-b last:border-0">
                  <td className="px-4 py-4 font-medium">{document.number}</td>
                  <td className="px-4 py-4">{document.customerName}</td>
                  <td className="px-4 py-4">{document.bookingNumber}</td>
                  <td className="px-4 py-4 capitalize">{document.type}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="capitalize">
                      {document.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">
                    {money.format(document.total)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/admin/documents/${document.id}`} />}
                    >
                      Preview
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!documents.length && (
            <div className="grid place-items-center p-12 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one from an active booking above.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
