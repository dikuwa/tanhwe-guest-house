import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { dateToDateOnly, formatDateOnly } from "./date-only";

const alluraFontPath = path.join(process.cwd(), "public", "fonts", "Allura-Regular.ttf");
if (fs.existsSync(alluraFontPath)) {
  Font.register({ family: "Allura", src: alluraFontPath });
}
const onestRegularPath = path.join(process.cwd(), "public", "fonts", "Onest-Regular.ttf");
const onestSemiBoldPath = path.join(process.cwd(), "public", "fonts", "Onest-SemiBold.ttf");
const onestBoldPath = path.join(process.cwd(), "public", "fonts", "Onest-Bold.ttf");
if (fs.existsSync(onestRegularPath)) {
  Font.register({
    family: "Onest",
    fonts: [
      { src: onestRegularPath, fontWeight: 400 },
      { src: onestSemiBoldPath, fontWeight: 500 },
      { src: onestSemiBoldPath, fontWeight: 600 },
      { src: onestBoldPath, fontWeight: 700 },
    ],
  });
}
const logoPath = path.join(process.cwd(), "public", "tanhwe-logo-pdf.png");

type PdfData = {
  number: string;
  type: string;
  createdAt: Date;
  expiresAt: Date | null;
  snapshot: string;
};
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
  }[];
  subtotal: number;
  extras: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;

  // Backward compatible folio line-items snapshot
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

type DocSettings = {
  businessName: string;
  physicalAddress: string;
  town: string;
  region: string;
  country: string;
  primaryPhone: string;
  businessEmail: string;
  websiteUrl: string;
  logoUrl: string;
  location: string;
  currency: string;
  bankingAccountName: string;
  bankingAccountNumber: string;
  bankingBankName: string;
  bankingBranchName: string;
  bankingBranchCode: string;
  bankingAccountType: string;
  bankingSwiftBic: string;
  bankTransferEnabled: boolean;
  bankTransferTitle: string;
  bankTransferInstructions: string;
  mobileWalletsEnabled: boolean;
  mobileWalletTitle: string;
  mobileWalletDescription: string;
  supportedWallets: string;
  acceptedPaymentTypes: string;
  managerRoleLabel: string;
  signatureImage: string;
  signatoryName: string;
  signatoryRole: string;
  footerText: string;
  paymentVisible: boolean;
  bankingVisible: boolean;
  signatureVisible: boolean;
  secureFooterVisible: boolean;
  secureFooterMessage: string;
  ownerName: string;
};

const styles = StyleSheet.create({
  page: {
    padding: "10.5mm",
    fontFamily: "Onest",
    color: "#3D372E",
    fontSize: 9,
    backgroundColor: "#FFFDF8",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  header: { paddingBottom: 10, borderBottom: "1px solid #E6E0D3", marginBottom: "8mm" },
  logo: { width: 100, height: 36 },
  documentType: { fontSize: 8, color: "#7A6F5E", textTransform: "uppercase", letterSpacing: 1 },
  documentNumber: { marginTop: 2, fontSize: 15, fontWeight: 600, color: "#3D372E" },
  muted: { color: "#7A6F5E", marginTop: 2 },
  eyebrow: {
    fontSize: 7,
    color: "#7A6F5E",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infRow: { flexDirection: "row", marginBottom: "6mm", borderBottom: "1px solid #E6E0D3", paddingBottom: 8, gap: 12 },
  infCol: { flex: 1, fontSize: 8 },
  infColCenter: { flex: 1, borderLeft: "1px solid #E6E0D3", borderRight: "1px solid #E6E0D3", paddingHorizontal: 8, fontSize: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F1E8",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontWeight: 600,
    fontSize: 7.5,
    borderTop: "1px solid #E6E0D3",
    borderBottom: "1px solid #E6E0D3",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: "1px solid #E6E0D3",
    fontSize: 8,
  },
  grow: { width: "28%" },
  cell: { width: "18%", textAlign: "right" },
  cellRate: { width: "12%", textAlign: "right" },
  cellNum: { width: "12%", textAlign: "right" },
  totals: { marginBottom: "6mm", paddingVertical: 6, borderTop: "1px solid #E6E0D3", borderBottom: "1px solid #E6E0D3", marginLeft: "55%", maxWidth: "45%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2, fontSize: 8 },
  totalStrong: { fontWeight: 600, fontSize: 9 },
  balance: { color: "#0D5CA8", fontWeight: 600, fontSize: 9 },
  cardsRow: { flexDirection: "row", marginBottom: "6mm", gap: 8 },
  card: {
    flex: 1,
    border: "1px solid #E6E0D3",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#FFFDF8",
    fontSize: 7.5,
  },
  cardTitle: {
    fontSize: 7,
    fontWeight: 600,
    color: "#7A6F5E",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  label: { fontSize: 7.5, color: "#7A6F5E", marginBottom: 1 },
  value: { fontSize: 8, marginBottom: 3 },
  mono: { fontSize: 8, fontFamily: "Courier", marginBottom: 3 },
  contactFooter: {
    flexDirection: "row",
    marginTop: "4mm",
    paddingTop: 8,
    borderTop: "1px solid #E6E0D3",
    gap: 12,
  },
  contactBlock: { flex: 1, fontSize: 8 },
  ownerBlock: { flex: 1, alignItems: "flex-end", fontSize: 8 },
  footer: {
    marginTop: "4mm",
    textAlign: "center",
    fontSize: 7,
    color: "#7A6F5E",
    borderTop: "1px solid #E6E0D3",
    paddingTop: 6,
  },
  paymentItem: { flexDirection: "row", gap: 6, marginBottom: 4 },
  paymentIconBox: {
    width: 8,
    height: 8,
    marginTop: 1,
    border: "1px solid #B8AD99",
    borderRadius: 1,
  },
  paymentLabel: { fontSize: 8, fontWeight: 600 },
  paymentDesc: { fontSize: 7, color: "#7A6F5E", marginTop: 1, lineHeight: 1.2 },
});

function BrandLogo() {
  if (fs.existsSync(logoPath)) {
    // react-pdf's Image is not a DOM image and does not expose alt text.
    // eslint-disable-next-line jsx-a11y/alt-text
    return <Image src={logoPath} style={styles.logo} />;
  }
  return (
    <View>
      <Text style={{ color: "#E68011", fontSize: 17, fontWeight: 700 }}>TANHWE</Text>
      <Text style={{ color: "#054386", fontSize: 9, fontWeight: 600, letterSpacing: 1.5 }}>
        GUEST HOUSE
      </Text>
    </View>
  );
}

export async function createDocumentPdf(data: PdfData, settings?: DocSettings) {
  const snapshot = JSON.parse(data.snapshot) as Snapshot;
  const {
    currency = "N$",
    bankingAccountName = "",
    bankingAccountNumber = "",
    bankingBankName = "",
    bankingBranchName = "",
    bankingBranchCode = "",
    bankingAccountType = "",
    bankingSwiftBic = "",
    bankTransferEnabled = false,
    bankTransferTitle = "Bank Transfer",
    bankTransferInstructions = "Pay via bank transfer using the details provided.",
    mobileWalletsEnabled = false,
    mobileWalletTitle = "Mobile Wallets",
    mobileWalletDescription = "",
    acceptedPaymentTypes = "Visa,Mastercard,eWallet",
    signatureImage = "",
    signatoryName = "Thomas Kamushambe",
    signatoryRole = "Managing Director",
    paymentVisible = true,
    bankingVisible = true,
    signatureVisible = true,
    secureFooterVisible = true,
    secureFooterMessage = "Secure payments. All transactions are safe and encrypted.",
    primaryPhone = "",
    businessEmail = "",
    town = "",
    region = "",
    country = "",
  } = settings ?? {
    currency: "N$",
    bankTransferEnabled: false,
    bankTransferTitle: "Bank Transfer",
    bankTransferInstructions: "Pay via bank transfer using the details provided.",
    mobileWalletsEnabled: false,
    mobileWalletTitle: "Mobile Wallets",
    mobileWalletDescription: "",
    acceptedPaymentTypes: "Visa,Mastercard,eWallet",
    signatoryName: "Thomas Kamushambe",
    signatoryRole: "Managing Director",
    paymentVisible: true,
    bankingVisible: true,
    signatureVisible: true,
    secureFooterVisible: true,
    secureFooterMessage: "Secure payments. All transactions are safe and encrypted.",
    primaryPhone: "",
    businessEmail: "",
    town: "",
    region: "",
    country: "",
    bankingAccountName: "",
    bankingAccountNumber: "",
    bankingBankName: "",
    bankingBranchName: "",
    bankingBranchCode: "",
    bankingAccountType: "",
    bankingSwiftBic: "",
    signatureImage: "",
  };
  const fmt = (value: number) =>
    `${currency}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const hasMixedRoomDates = snapshot.rooms.some((room) => {
    const roomCheckIn = room.checkIn ?? snapshot.stay.checkIn;
    const roomCheckOut = room.checkOut ?? snapshot.stay.checkOut;
    return roomCheckIn !== snapshot.stay.checkIn || roomCheckOut !== snapshot.stay.checkOut;
  });

  return renderToBuffer(
    <Document title={`${data.type} ${data.number}`}>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={[styles.row, styles.header]}>
          <View>
            <BrandLogo />
            <Text style={[styles.muted, { textAlign: "right", fontSize: 7 }]}>
              {[town, region, country].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.documentType}>{data.type}</Text>
            <Text style={styles.documentNumber}>{data.number}</Text>
            <Text style={{ marginTop: 4, fontSize: 8 }}>
              Issued {data.createdAt.toLocaleDateString("en-NA")}
            </Text>
            {data.expiresAt && (
              <Text style={{ fontSize: 8 }}>
                Valid until {data.expiresAt.toLocaleDateString("en-NA")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Guest, Stay & Contact in One Compact Row ── */}
        <View style={styles.infRow}>
          {/* Guest */}
          <View style={styles.infCol}>
            <Text style={styles.eyebrow}>GUEST</Text>
            <Text style={{ marginTop: 3, fontWeight: 600, fontSize: 8 }}>{snapshot.customer.name}</Text>
            <Text style={[styles.muted, { fontSize: 7 }]}>{snapshot.customer.phone}</Text>
            {snapshot.customer.email && (
              <Text style={[styles.muted, { fontSize: 7 }]}>{snapshot.customer.email}</Text>
            )}
          </View>

          {/* Stay */}
          <View style={styles.infColCenter}>
            <Text style={styles.eyebrow}>STAY</Text>
            {hasMixedRoomDates ? (
              <>
                <Text style={{ marginTop: 3, fontSize: 8 }}>Multiple room stays</Text>
                <Text style={[styles.muted, { fontSize: 7 }]}>
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ marginTop: 3, fontSize: 8 }}>
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </Text>
                <Text style={[styles.muted, { fontSize: 7 }]}>
                  {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"}
                </Text>
              </>
            )}
            <Text style={[styles.muted, { fontSize: 7, marginTop: 2 }]}>{snapshot.bookingNumber}</Text>
          </View>

          {/* Contact */}
          <View style={[styles.infCol, { textAlign: "right" }]}>
            <Text style={styles.eyebrow}>CONTACT</Text>
            {primaryPhone && <Text style={[styles.muted, { fontSize: 7, marginTop: 3 }]}>{primaryPhone}</Text>}
            {businessEmail && <Text style={[styles.muted, { fontSize: 7 }]}>{businessEmail}</Text>}
          </View>
        </View>

        {/* ── Room Table ── */}
        <View style={{ marginBottom: "4mm" }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.grow, { width: "28%" }]}>Room</Text>
            <Text style={[styles.cell, { width: "18%" }]}>Dates</Text>
            <Text style={[styles.cellRate, { width: "12%" }]}>Rate</Text>
            <Text style={[styles.cellNum, { width: "12%" }]}>Rooms</Text>
            <Text style={[styles.cellNum, { width: "12%" }]}>Nights</Text>
            <Text style={[styles.cell, { width: "18%" }]}>Amount</Text>
          </View>
          {snapshot.rooms.map((room, index) => {
            const roomCheckIn = dateToDateOnly(room.checkIn ?? snapshot.stay.checkIn);
            const roomCheckOut = dateToDateOnly(room.checkOut ?? snapshot.stay.checkOut);
            const dates = `${formatDateOnly(roomCheckIn, { day: "numeric", month: "short" })} - ${formatDateOnly(roomCheckOut, { day: "numeric", month: "short" })}`;
            return (
              <View key={`${room.name}-${index}`} style={styles.tableRow}>
                <Text style={[styles.grow, { width: "28%", fontWeight: 500 }]}>{room.name}</Text>
                <Text style={[styles.cell, { width: "18%", fontSize: 7, color: "#7A6F5E" }]}>
                  {dates}
                </Text>
                <Text style={[styles.cellRate, { width: "12%" }]}>{fmt(room.pricePerNight)}</Text>
                <Text style={[styles.cellNum, { width: "12%" }]}>{room.roomsCount}</Text>
                <Text style={[styles.cellNum, { width: "12%" }]}>{room.nights}</Text>
                <Text style={[styles.cell, { width: "18%" }]}>{fmt(room.subtotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Folio lines ── */}
        {snapshot.folioLines && snapshot.folioLines.length > 0 && (
          <View style={{ marginBottom: "4mm" }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.grow, { width: "42%" }]}>Item</Text>
              <Text style={[styles.cell, { width: "12%" }]}>Qty</Text>
              <Text style={[styles.cell, { width: "18%" }]}>Unit</Text>
              <Text style={[styles.cell, { width: "18%" }]}>Total</Text>
            </View>

            {snapshot.folioLines
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((line, idx) => (
                <View key={`${line.kind}-${line.name}-${idx}`} style={styles.tableRow}>
                  <View style={{ width: "42%" }}>
                    <Text style={{ fontWeight: 500, fontSize: 8 }}>{line.name}</Text>
                    {line.description ? (
                      <Text style={{ fontSize: 7, color: "#7A6F5E", marginTop: 1 }}>
                        {line.description}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={[styles.cell, { width: "12%" }]}>{line.qty}</Text>
                  <Text style={[styles.cell, { width: "18%" }]}>{fmt(line.unitPrice)}</Text>
                  <Text style={[styles.cell, { width: "18%", color: line.kind === "discount" ? "#b45309" : "inherit" }]}>
                    {line.kind === "discount" ? `- ${fmt(line.lineTotal)}` : fmt(line.lineTotal)}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* ── Totals ── */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmt(snapshot.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Extras</Text>
            <Text>{fmt(snapshot.extras)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>- {fmt(snapshot.discount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalStrong]}>
            <Text>Total</Text>
            <Text>{fmt(snapshot.total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Paid</Text>
            <Text>{fmt(snapshot.amountPaid)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalStrong]}>
            <Text style={styles.balance}>Balance due</Text>
            <Text style={styles.balance}>{fmt(snapshot.balanceDue)}</Text>
          </View>
        </View>

        {/* ── Banking & Payment Cards ── */}
        {(bankingVisible || paymentVisible) && (
          <View style={styles.cardsRow}>
            {bankingVisible && bankingAccountName && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Banking Details</Text>
                <View style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text style={[styles.label, { width: 70 }]}>Account Name</Text>
                  <Text style={styles.value}>{bankingAccountName}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text style={[styles.label, { width: 70 }]}>Account Number</Text>
                  <Text style={styles.mono}>{bankingAccountNumber}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text style={[styles.label, { width: 70 }]}>Bank</Text>
                  <Text style={styles.value}>{bankingBankName}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 0 }}>
                  <Text style={[styles.label, { width: 70 }]}>Branch</Text>
                  <Text style={styles.value}>{bankingBranchName}</Text>
                </View>
                {bankingBranchCode && (
                  <>
                    <Text style={styles.label}>Branch Code</Text>
                    <Text style={styles.value}>{bankingBranchCode}</Text>
                  </>
                )}
                {bankingAccountType && (
                  <>
                    <Text style={styles.label}>Account Type</Text>
                    <Text style={styles.value}>{bankingAccountType}</Text>
                  </>
                )}
                {bankingSwiftBic && (
                  <>
                    <Text style={styles.label}>SWIFT/BIC</Text>
                    <Text style={styles.value}>{bankingSwiftBic}</Text>
                  </>
                )}
              </View>
            )}

            {paymentVisible && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Methods</Text>
                {bankTransferEnabled && (
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentIconBox} />
                    <View>
                      <Text style={styles.paymentLabel}>{bankTransferTitle}</Text>
                      <Text style={styles.paymentDesc}>{bankTransferInstructions}</Text>
                    </View>
                  </View>
                )}
                {mobileWalletsEnabled && (
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentIconBox} />
                    <View>
                      <Text style={styles.paymentLabel}>{mobileWalletTitle}</Text>
                      <Text style={styles.paymentDesc}>{mobileWalletDescription}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Contact & Signature in One Compact Footer Row ── */}
        <View style={styles.contactFooter}>
          <View style={styles.contactBlock}>
            <Text style={styles.eyebrow}>Contact Us</Text>
            <Text style={{ fontSize: 8, marginTop: 3 }}>Phone: {primaryPhone}</Text>
            <Text style={{ fontSize: 8 }}>Email: {businessEmail}</Text>
            <Text style={{ fontSize: 8 }}>
              Location: {town}
              {town && region ? ", " : ""}
              {region}
              {region && country ? ", " : ""}
              {country}
            </Text>
          </View>
          {signatureVisible && (
            <View style={styles.ownerBlock}>
              {signatureImage ? (
                <Text style={{ fontSize: 8, fontWeight: 600, color: "#3D372E" }}>
                  {signatoryName}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "Allura",
                    fontSize: 18,
                    lineHeight: 1,
                    color: "#3D372E",
                    marginBottom: 2,
                    transform: "rotate(-4deg)",
                  }}
                >
                  {signatoryName}
                </Text>
              )}
              <Text style={{ fontSize: 8, fontWeight: 600, color: "#3D372E" }}>
                {signatoryName}
              </Text>
              <Text style={{ fontSize: 7.5, color: "#7A6F5E" }}>{signatoryRole}</Text>
            </View>
          )}
        </View>

        {/* ── Secure Payment Footer ── */}
        {secureFooterVisible && (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "4mm",
                paddingTop: 6,
                borderTop: "1px solid #E6E0D3",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 8, color: "#059669" }}>✓</Text>
              <Text style={{ fontSize: 7, color: "#7A6F5E" }}>{secureFooterMessage}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 4, gap: 12 }}>
              {acceptedPaymentTypes.split(",").map((type) => (
                <Text
                  key={type.trim()}
                  style={{ fontSize: 7, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.8 }}
                >
                  {type.trim()}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
