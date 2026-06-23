import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";
import { DocumentEmailButton } from "@/components/admin/document-email-button";
import { Button } from "@/components/ui/button";
import { getDocument } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { createDocumentShareToken } from "@/lib/document-share";

type Snapshot = {
  bookingNumber: string;
  customer: { name: string; phone: string; email?: string | null };
  stay: { checkIn: string; checkOut: string; nights: number };
  rooms: {
    name: string;
    pricePerNight: number;
    roomsCount: number;
    nights: number;
    subtotal: number;
  }[];
  subtotal: number;
  extras: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
};
const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });

export default async function DocumentPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["owner", "admin"]);
  const document = await getDocument((await params).id);
  if (!document) notFound();
  const snapshot = JSON.parse(document.snapshot) as Snapshot;
  const shareToken = createDocumentShareToken(document.id);
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/admin/documents/${document.id}/pdf?token=${encodeURIComponent(shareToken)}`;
  const shareText = encodeURIComponent(
    `${document.type.toUpperCase()} ${document.number} from Tanhwe Guest House. Total: ${money.format(document.total)}. Download: ${downloadUrl}`
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/documents" />}>
          <ArrowLeft />
          Documents
        </Button>
        <div className="flex flex-wrap gap-2">
          <DocumentEmailButton id={document.id} disabled={!document.customerEmail} />
          <Button
            variant="outline"
            render={
              <a
                href={`https://wa.me/${snapshot.customer.phone.replace(/\D/g, "")}?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <MessageCircle />
            Share
          </Button>
          <Button render={<a href={`/api/admin/documents/${document.id}/pdf`} />}>
            <Download />
            Download PDF
          </Button>
        </div>
      </div>
      <article className="mx-auto max-w-4xl border bg-card p-7 shadow-sm sm:p-12">
        <header className="flex flex-wrap justify-between gap-8 border-b pb-8">
          <div>
            <p className="text-2xl font-semibold text-secondary">Tanhwe Guest House</p>
            <p className="mt-2 text-sm text-muted-foreground">Mukwe, Namibia</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              {document.type}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{document.number}</h1>
            <p className="mt-2 text-sm">Issued {document.createdAt.toLocaleDateString("en-NA")}</p>
            {document.expiresAt && (
              <p className="text-sm">
                Valid until {document.expiresAt.toLocaleDateString("en-NA")}
              </p>
            )}
          </div>
        </header>
        <div className="grid gap-8 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guest
            </p>
            <p className="mt-2 font-semibold">{snapshot.customer.name}</p>
            <p className="text-sm text-muted-foreground">{snapshot.customer.phone}</p>
            {snapshot.customer.email && (
              <p className="text-sm text-muted-foreground">{snapshot.customer.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stay
            </p>
            <p className="mt-2">
              {new Date(snapshot.stay.checkIn).toLocaleDateString("en-NA")} to{" "}
              {new Date(snapshot.stay.checkOut).toLocaleDateString("en-NA")}
            </p>
            <p className="text-sm text-muted-foreground">
              {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"} ·{" "}
              {snapshot.bookingNumber}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead className="border-y bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-3">Room</th>
                <th className="px-3 py-3 text-right">Rate</th>
                <th className="px-3 py-3 text-right">Rooms</th>
                <th className="px-3 py-3 text-right">Nights</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.rooms.map((room, index) => (
                <tr key={`${room.name}-${index}`} className="border-b">
                  <td className="px-3 py-4 font-medium">{room.name}</td>
                  <td className="px-3 py-4 text-right">{money.format(room.pricePerNight)}</td>
                  <td className="px-3 py-4 text-right">{room.roomsCount}</td>
                  <td className="px-3 py-4 text-right">{room.nights}</td>
                  <td className="px-3 py-4 text-right">{money.format(room.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto mt-8 max-w-sm space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money.format(snapshot.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Extras</span>
            <span>{money.format(snapshot.extras)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>− {money.format(snapshot.discount)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{money.format(snapshot.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{money.format(snapshot.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-secondary">
            <span>Balance due</span>
            <span>{money.format(snapshot.balanceDue)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
