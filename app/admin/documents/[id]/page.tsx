import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Download, Landmark, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { DocumentEmailButton } from "@/components/admin/document-email-button";
import { SignatureBlock } from "@/components/signature-block";
import { Button } from "@/components/ui/button";
import {
  getDocument,
  getDocumentSettings,
  generateShareCode,
  getPublicShareCode,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { dateToDateOnly, formatDateOnly } from "@/lib/date-only";
import { whatsappHref } from "@/lib/phone";
import { buildLocation } from "@/lib/utils";

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
    checkIn?: string;
    checkOut?: string;
    guestsCount?: number | null;
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

  const settings = await getDocumentSettings();
  const snapshot = JSON.parse(document.snapshot) as Snapshot;
  const hasMixedRoomDates = snapshot.rooms.some((room) => {
    const roomCheckIn = room.checkIn ?? snapshot.stay.checkIn;
    const roomCheckOut = room.checkOut ?? snapshot.stay.checkOut;
    return roomCheckIn !== snapshot.stay.checkIn || roomCheckOut !== snapshot.stay.checkOut;
  });

  let existingShare = await getPublicShareCode(document.id);
  if (!existingShare) {
    existingShare = await generateShareCode(document.id, document.number);
  }
  const cleanLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/d/${existingShare.publicCode}`;

  const typeLabel = document.type.charAt(0).toUpperCase() + document.type.slice(1);
  const shareMessage = `Your ${document.type} from ${settings.businessName} is ready.\n\n${typeLabel}: ${document.number}\nTotal: ${settings.currency}${document.total.toFixed(2)}\n\nView or download:\n${cleanLink}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/documents" />}
        >
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
            nativeButton={false}
            render={
              <a
                href={whatsappHref(snapshot.customer.phone, shareMessage)}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <MessageCircle />
            Share
          </Button>
          <Button nativeButton={false} render={<a href={`/api/admin/documents/${document.id}/pdf`} />}>
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
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {buildLocation(settings.town, settings.region, settings.country)}
            </p>
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
            {hasMixedRoomDates ? (
              <>
                <p className="mt-2">Multiple room stays</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))} &middot;{" "}
                  {snapshot.bookingNumber}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2">
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"} &middot;{" "}
                  {snapshot.bookingNumber}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Room Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead className="border-y bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-3">Room</th>
                <th className="px-3 py-3 text-right">Dates</th>
                <th className="px-3 py-3 text-right">Rate</th>
                <th className="px-3 py-3 text-right">Rooms</th>
                <th className="px-3 py-3 text-right">Nights</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.rooms.map((room, index) => {
                const roomCheckIn = dateToDateOnly(room.checkIn ?? snapshot.stay.checkIn);
                const roomCheckOut = dateToDateOnly(room.checkOut ?? snapshot.stay.checkOut);
                const dates = `${formatDateOnly(roomCheckIn, { day: "numeric", month: "short" })} - ${formatDateOnly(roomCheckOut, { day: "numeric", month: "short" })}`;
                return (
                  <tr key={`${room.name}-${index}`} className="border-b">
                    <td className="px-3 py-4 font-medium">{room.name}</td>
                    <td className="px-3 py-4 text-right text-muted-foreground text-xs">{dates}</td>
                    <td className="px-3 py-4 text-right">{money.format(room.pricePerNight)}</td>
                    <td className="px-3 py-4 text-right">{room.roomsCount}</td>
                    <td className="px-3 py-4 text-right">{room.nights}</td>
                    <td className="px-3 py-4 text-right">{money.format(room.subtotal)}</td>
                  </tr>
                );
              })}
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
        {(settings.bankingVisible || settings.paymentVisible) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {settings.bankingVisible && settings.bankingAccountName && (
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
              <span className="text-muted-foreground">Account Number</span>
              <span className="font-mono">{settings.bankingAccountNumber}</span>
              <span className="text-muted-foreground">Bank</span>
              <span>{settings.bankingBankName}</span>
              <span className="text-muted-foreground">Branch</span>
              <span>{settings.bankingBranchName}</span>
              {settings.bankingBranchCode && (
              <><span className="text-muted-foreground">Branch Code</span><span>{settings.bankingBranchCode}</span></>
              )}
              {settings.bankingAccountType && (
              <><span className="text-muted-foreground">Account Type</span><span>{settings.bankingAccountType}</span></>
              )}
              {settings.bankingSwiftBic && (
              <><span className="text-muted-foreground">SWIFT/BIC</span><span>{settings.bankingSwiftBic}</span></>
              )}
            </div>
          </div>
          )}

          {settings.paymentVisible && (
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
                  <p className="text-sm font-medium">{settings.bankTransferTitle}</p>
                  <p className="text-sm text-muted-foreground">{settings.bankTransferInstructions}</p>
                </div>
              </div>
              )}
              {settings.mobileWalletsEnabled && (
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                <div>
                  <p className="text-sm font-medium">{settings.mobileWalletTitle}</p>
                  <p className="text-sm text-muted-foreground">{settings.mobileWalletDescription}</p>
                </div>
              </div>
              )}
            </div>
          </div>
          )}
        </div>
        )}

        {/* ── Contact & Signature ── */}
        <div className="mt-8 grid gap-8 border-t pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Us
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p>Phone: {settings.primaryPhone}</p>
              <p>Email: {settings.businessEmail}</p>
              <p>Location: {settings.town}{settings.town && settings.region ? ", " : ""}{settings.region}{settings.region && settings.country ? ", " : ""}{settings.country}</p>
            </div>
          </div>
          {settings.signatureVisible && (
          <div className="sm:text-right">
            <SignatureBlock ownerName={settings.signatoryName} roleLabel={settings.signatoryRole} />
          </div>
          )}
        </div>

        {/* ── Secure Payment Footer ── */}
        {settings.secureFooterVisible && (
        <div className="mt-8 border-t pt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <span>{settings.secureFooterMessage}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {settings.acceptedPaymentTypes.split(",").map((type) => (
              <span key={type.trim()} className="font-semibold tracking-wide text-neutral-400">
                {type.trim()}
              </span>
            ))}
          </div>
        </div>
        )}
      </article>
    </div>
  );
}
