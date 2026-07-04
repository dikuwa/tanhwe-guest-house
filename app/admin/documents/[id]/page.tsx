import { DocumentEmailButton } from "@/components/admin/document-email-button";
import { SignatureBlock } from "@/components/signature-block";
import { TanhweLogo } from "@/components/tanhwe-logo";
import { Button } from "@/components/ui/button";
import {
  generateShareCode,
  getDocument,
  getDocumentSettings,
  getPublicShareCode,
} from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { dateToDateOnly, formatDateOnly } from "@/lib/date-only";
import { whatsappHref } from "@/lib/phone";
import { buildLocation } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Download,
  Landmark,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });

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

  // Added for booking folio line items (backward compatible)
  folioLines?: {
    kind: "service" | "custom" | "discount";
    name: string;
    description?: string | null;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    sortOrder?: number;
  }[];
};

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
          <DocumentEmailButton id={document.id} disabled={!document.customerEmail} />
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
          <Button
            nativeButton={false}
            render={<a href={`/api/admin/documents/${document.id}/pdf`} />}
          >
            <Download />
            Download PDF
          </Button>
        </div>
      </div>

      <article className="mx-auto max-w-4xl border bg-card shadow-sm print:max-w-none" style={{ padding: "14mm" }}>
        {/* ── Header ── */}
        <header className="flex flex-wrap justify-between gap-4 border-b pb-3" style={{ marginBottom: "10mm" }}>
          <div>
            <TanhweLogo size="md" showIcon />
            <p className="mt-0.5 text-right text-xs text-muted-foreground">
              {buildLocation(settings.town, settings.region, settings.country)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {document.type}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold">{document.number}</h1>
            <p className="mt-1 text-xs">Issued {document.createdAt.toLocaleDateString("en-NA")}</p>
            {document.expiresAt && (
              <p className="text-xs">
                Valid until {document.expiresAt.toLocaleDateString("en-NA")}
              </p>
            )}
          </div>
        </header>

        {/* ── Guest, Stay & Contact in One Compact Row ── */}
        <div
          className="grid gap-3 py-4 text-xs border-b"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "8mm" }}
        >
          {/* Guest Column */}
          <div className="text-left">
            <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] mb-1">
              Guest
            </p>
            <p className="font-medium text-sm">{snapshot.customer.name}</p>
            {snapshot.customer.phone && (
              <p className="text-xs text-muted-foreground">{snapshot.customer.phone}</p>
            )}
            {snapshot.customer.email && (
              <p className="text-xs text-muted-foreground truncate">{snapshot.customer.email}</p>
            )}
          </div>

          {/* Stay Column */}
          <div className="text-center border-l border-r border-muted-foreground/10 px-3">
            <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] mb-1">
              Stay
            </p>
            {hasMixedRoomDates ? (
              <>
                <p className="text-sm font-medium">Multiple room stays</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"}
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-1">{snapshot.bookingNumber}</p>
          </div>

          {/* Contact Column */}
          <div className="text-right">
            <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] mb-1">
              Contact
            </p>
            {settings.primaryPhone && (
              <p className="text-xs text-muted-foreground">{settings.primaryPhone}</p>
            )}
            {settings.businessEmail && (
              <p className="text-xs text-muted-foreground truncate">{settings.businessEmail}</p>
            )}
          </div>
        </div>

        {/* ── Room Table ── */}
        <div className="overflow-x-auto mb-3">
          <table className="w-full min-w-160 text-xs">
            <thead className="border-y bg-muted/40 text-left">
              <tr>
                <th className="px-2 py-2">Room</th>
                <th className="px-2 py-2 text-right">Dates</th>
                <th className="px-2 py-2 text-right">Rate</th>
                <th className="px-2 py-2 text-right">Rooms</th>
                <th className="px-2 py-2 text-right">Nights</th>
                <th className="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.rooms.map((room, index) => {
                const roomCheckIn = dateToDateOnly(room.checkIn ?? snapshot.stay.checkIn);
                const roomCheckOut = dateToDateOnly(room.checkOut ?? snapshot.stay.checkOut);
                const dates = `${formatDateOnly(roomCheckIn, { day: "numeric", month: "short" })} - ${formatDateOnly(roomCheckOut, { day: "numeric", month: "short" })}`;
                return (
                  <tr key={`${room.name}-${index}`} className="border-b">
                    <td className="px-2 py-2 font-medium">{room.name}</td>
                    <td className="px-2 py-2 text-right text-muted-foreground text-[11px]">{dates}</td>
                    <td className="px-2 py-2 text-right">{money.format(room.pricePerNight)}</td>
                    <td className="px-2 py-2 text-right">{room.roomsCount}</td>
                    <td className="px-2 py-2 text-right">{room.nights}</td>
                    <td className="px-2 py-2 text-right">{money.format(room.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Folio / Additional items ── */}
        {snapshot.folioLines && snapshot.folioLines.length > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Additional items</p>
              <p className="text-[10px] text-muted-foreground">Services, extras and discounts</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-xs">
                <thead className="border-y bg-muted/40 text-left">
                  <tr>
                    <th className="px-2 py-2">Item</th>
                    <th className="px-2 py-2 text-right">Type</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-right">Unit</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.folioLines
                    .slice()
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((line, idx) => {
                      const typeLabel =
                        line.kind === "service"
                          ? "Service"
                          : line.kind === "discount"
                            ? "Discount"
                            : "Extra";
                      const typeColors =
                        line.kind === "discount"
                          ? "bg-amber-100 text-amber-800"
                          : line.kind === "service"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800";
                      return (
                        <tr key={`${line.kind}-${line.name}-${idx}`} className="border-b">
                          <td className="px-2 py-2">
                            <div className="font-medium">{line.name}</div>
                            {line.description && (
                              <div className="text-[10px] text-muted-foreground">
                                {line.description}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeColors}`}
                            >
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right">{line.qty}</td>
                          <td className="px-2 py-2 text-right">{money.format(line.unitPrice)}</td>
                          <td
                            className={`px-2 py-2 text-right font-medium tabular-nums ${line.kind === "discount" ? "text-amber-700" : ""}`}
                          >
                            {line.kind === "discount"
                              ? `\u2212 ${money.format(line.lineTotal)}`
                              : money.format(line.lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Totals ── */}
        <div className="ml-auto max-w-xs space-y-1 text-xs mb-3 py-2 border-t border-b">
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
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{money.format(snapshot.total)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Paid</span>
            <span>{money.format(snapshot.amountPaid)}</span>
          </div>
          <div className="flex justify-between font-semibold text-secondary">
            <span>Balance due</span>
            <span>{money.format(snapshot.balanceDue)}</span>
          </div>
        </div>

        {/* ── Banking Details & Payment Methods ── */}
        {(settings.bankingVisible || settings.paymentVisible) && (
          <div className="grid gap-2 sm:grid-cols-2 mb-3">
            {settings.bankingVisible && settings.bankingAccountName && (
              <div className="rounded border bg-muted/20 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Landmark className="size-3 text-muted-foreground" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Banking Details
                  </h3>
                </div>
                <div
                  className="space-y-1 text-xs"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "0.25rem 0.75rem",
                    alignItems: "baseline",
                  }}
                >
                  <span className="text-muted-foreground">Account Name</span>
                  <span>{settings.bankingAccountName}</span>
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-mono">{settings.bankingAccountNumber}</span>
                  <span className="text-muted-foreground">Bank</span>
                  <span>{settings.bankingBankName}</span>
                  <span className="text-muted-foreground">Branch</span>
                  <span>{settings.bankingBranchName}</span>
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
                      <span>{settings.bankingSwiftBic}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {settings.paymentVisible && (
              <div className="rounded border bg-muted/20 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wallet className="size-3 text-muted-foreground" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Methods
                  </h3>
                </div>
                <div className="space-y-2">
                  {settings.bankTransferEnabled && (
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-3 shrink-0 text-muted-foreground/60" />
                      <div>
                        <p className="text-xs font-medium">{settings.bankTransferTitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {settings.bankTransferInstructions}
                        </p>
                      </div>
                    </div>
                  )}
                  {settings.mobileWalletsEnabled && (
                    <div className="flex items-start gap-2">
                      <Wallet className="mt-0.5 size-3 shrink-0 text-muted-foreground/60" />
                      <div>
                        <p className="text-xs font-medium">{settings.mobileWalletTitle}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {settings.mobileWalletDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Contact & Signature in One Compact Footer Row ── */}
        <div className="flex gap-6 border-t py-2 text-xs sm:flex-row flex-col">
          <div className="flex-1">
            <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px] mb-1">
              Contact Us
            </p>
            <div className="space-y-0.5 text-xs">
              <p>Phone: {settings.primaryPhone}</p>
              <p>Email: {settings.businessEmail}</p>
              <p>
                Location: {settings.town}
                {settings.town && settings.region ? ", " : ""}
                {settings.region}
                {settings.region && settings.country ? ", " : ""}
                {settings.country}
              </p>
            </div>
          </div>
          {settings.signatureVisible && (
            <div className="sm:text-right flex-1">
              <SignatureBlock
                ownerName={settings.signatoryName}
                roleLabel={settings.signatoryRole}
              />
            </div>
          )}
        </div>

        {/* ── Secure Payment Footer ── */}
        {settings.secureFooterVisible && (
          <div className="mt-2 border-t pt-2 text-center text-xs">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <ShieldCheck className="size-3 shrink-0 text-emerald-600" />
              <span className="text-[10px]">{settings.secureFooterMessage}</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-[9px]">
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
