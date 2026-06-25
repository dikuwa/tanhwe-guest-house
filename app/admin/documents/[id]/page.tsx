import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Download, Landmark, MessageCircle, Wallet } from "lucide-react";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { DocumentEmailButton } from "@/components/admin/document-email-button";
import { SignatureBlock } from "@/components/signature-block";
import { Button } from "@/components/ui/button";
import {
  getDocument,
  getDocumentSettings,
  getOwnerProfile,
  generateShareCode,
  getPublicShareCode,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { createDocumentShareToken } from "@/lib/document-share";
import { getDb } from "@/lib/db";

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

  const [settings, owner] = await Promise.all([
    getDocumentSettings(),
    getOwnerProfile(),
  ]);
  const snapshot = JSON.parse(document.snapshot) as Snapshot;

  let existingShare = await getPublicShareCode(document.id);
  if (!existingShare) {
    existingShare = await generateShareCode(document.id, document.number);
  }
  const cleanLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/d/${existingShare.publicCode}`;

  const shareToken = createDocumentShareToken(document.id);
  const oldDownloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/admin/documents/${document.id}/pdf?token=${encodeURIComponent(shareToken)}`;

  const typeLabel = document.type.charAt(0).toUpperCase() + document.type.slice(1);
  const shareText = encodeURIComponent(
    `Your ${document.type} from ${settings.businessName} is ready.\n\n${typeLabel}: ${document.number}\nTotal: ${settings.currency}${document.total.toFixed(2)}\n\nView or download:\n${cleanLink}`
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/documents" />}>
          <ArrowLeft />
          Documents
        </Button>
        <div className="flex flex-wrap gap-2">
          <DocumentEmailButton
            id={document.id}
            disabled={!document.customerEmail}
          />
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
        {/* ── Header ── */}
        <header className="flex flex-wrap justify-between gap-8 border-b pb-8">
          <div>
            <TanhweLogo size="md" showIcon />
            <p className="mt-2 text-sm text-muted-foreground">{settings.location}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              {document.type}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{document.number}</h1>
            <p className="mt-2 text-sm">Issued {document.createdAt.toLocaleDateString("en-NA")}</p>
            {document.expiresAt && (
              <p className="text-sm">Valid until {document.expiresAt.toLocaleDateString("en-NA")}</p>
            )}
          </div>
        </header>

        {/* ── Guest & Stay ── */}
        <div className="grid gap-8 py-8" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(260px, auto)" }}>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guest</p>
            <p className="mt-2 font-semibold">{snapshot.customer.name}</p>
            <p className="text-sm text-muted-foreground">{snapshot.customer.phone}</p>
            {snapshot.customer.email && (
              <p className="text-sm text-muted-foreground">{snapshot.customer.email}</p>
            )}
          </div>
          <div className="text-right" style={{ justifySelf: "end" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stay</p>
            <p className="mt-2">
              {new Date(snapshot.stay.checkIn).toLocaleDateString("en-NA")} to{" "}
              {new Date(snapshot.stay.checkOut).toLocaleDateString("en-NA")}
            </p>
            <p className="text-sm text-muted-foreground">
              {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"} &middot;{" "}
              {snapshot.bookingNumber}
            </p>
          </div>
        </div>

        {/* ── Room Table ── */}
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

        {/* ── Totals ── */}
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
            <span>&minus; {money.format(snapshot.discount)}</span>
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

        {/* ── Banking Details & Payment Methods ── */}
        {settings.paymentVisible && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {settings.bankTransferEnabled && settings.bankingAccountName && (
              <div className="rounded-lg border bg-muted/20 p-5">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Banking Details
                  </h3>
                </div>
                <div className="mt-4 space-y-2.5 text-sm" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", alignItems: "baseline" }}>
                  <span className="text-muted-foreground">Account Name</span>
                  <span>{settings.bankingAccountName}</span>
                  {settings.bankingAccountNumber && (
                    <>
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-mono">{settings.bankingAccountNumber}</span>
                    </>
                  )}
                  {settings.bankingBankName && (
                    <>
                      <span className="text-muted-foreground">Bank</span>
                      <span>{settings.bankingBankName}</span>
                    </>
                  )}
                  {settings.bankingBranchName && (
                    <>
                      <span className="text-muted-foreground">Branch</span>
                      <span>{settings.bankingBranchName}</span>
                    </>
                  )}
                  {settings.bankingBranchCode && (
                    <>
                      <span className="text-muted-foreground">Branch Code</span>
                      <span>{settings.bankingBranchCode}</span>
                    </>
                  )}
                  {settings.bankingAccountType && (
                    <>
                      <span className="text-muted-foreground">Account Type</span>
                      <span>{settings.bankingAccountType}</span>
                    </>
                  )}
                  {settings.bankingSwiftBic && (
                    <>
                      <span className="text-muted-foreground">SWIFT/BIC</span>
                      <span className="font-mono">{settings.bankingSwiftBic}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-muted/20 p-5">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Methods
                </h3>
              </div>
              <div className="mt-4 space-y-4">
                {settings.bankTransferEnabled && (
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                    <div>
                      <p className="text-sm font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">
                        Pay via bank transfer using the details provided.
                      </p>
                    </div>
                  </div>
                )}
                {settings.mobileWalletsEnabled && (
                  <div className="flex items-start gap-3">
                    <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                    <div>
                      <p className="text-sm font-medium">Mobile Wallets</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.mobileWalletDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Contact & Signature ── */}
        <div className="mt-8 grid gap-8 border-t pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Us
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              {settings.primaryPhone && <p>{settings.primaryPhone}</p>}
              {settings.businessEmail && <p>{settings.businessEmail}</p>}
              {settings.physicalAddress && <p>{settings.physicalAddress}</p>}
            </div>
          </div>
          {owner && (
            <div className="sm:text-right">
              <SignatureBlock ownerName={owner.name} roleLabel={settings.managerRoleLabel} />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {settings.footerText && (
          <p className="mt-8 text-center text-xs text-muted-foreground border-t pt-4">
            {settings.footerText}
          </p>
        )}

        {/* ── Closing ── */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Thank you for choosing {settings.businessName}.
        </p>
      </article>
    </div>
  );
}
