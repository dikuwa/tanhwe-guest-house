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
import path from "path";
import fs from "fs";
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
    padding: 36,
    fontFamily: "Onest",
    color: "#3D372E",
    fontSize: 10,
    backgroundColor: "#FFFDF8",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  header: { paddingBottom: 20, borderBottom: "1px solid #E6E0D3" },
  logo: { width: 112, height: 40 },
  documentType: { fontSize: 9, color: "#7A6F5E", textTransform: "uppercase", letterSpacing: 1.2 },
  documentNumber: { marginTop: 3, fontSize: 17, fontWeight: 600, color: "#3D372E" },
  muted: { color: "#7A6F5E", marginTop: 4 },
  eyebrow: {
    fontSize: 8,
    color: "#7A6F5E",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  section: { marginTop: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F1E8",
    paddingVertical: 9,
    paddingHorizontal: 9,
    fontWeight: 600,
    borderTop: "1px solid #E6E0D3",
    borderBottom: "1px solid #E6E0D3",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 9,
    borderBottom: "1px solid #E6E0D3",
  },
  grow: { width: "42%" },
  cell: { width: "14.5%", textAlign: "right" },
  totals: { marginTop: 20, marginLeft: "52%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalStrong: { borderTop: "1px solid #E6E0D3", paddingTop: 8, fontSize: 11, fontWeight: 600 },
  balance: { color: "#0D5CA8", fontWeight: 600, fontSize: 11 },
  cardsRow: { flexDirection: "row", marginTop: 18, gap: 14 },
  card: {
    flex: 1,
    border: "1px solid #E6E0D3",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFDF8",
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: "#7A6F5E",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  label: { fontSize: 9, color: "#7A6F5E", marginBottom: 1 },
  value: { fontSize: 10, marginBottom: 6 },
  mono: { fontSize: 10, fontFamily: "Courier", marginBottom: 6 },
  contactRow: {
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid #E6E0D3",
  },
  contactBlock: { flex: 1 },
  ownerBlock: { flex: 1, alignItems: "flex-end" },
  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#7A6F5E",
    borderTop: "1px solid #E6E0D3",
    paddingTop: 12,
  },
  closing: { marginTop: 16, textAlign: "center", fontSize: 10, color: "#667085" },
  paymentItem: { flexDirection: "row", gap: 8, marginBottom: 7 },
  paymentIconBox: {
    width: 10,
    height: 10,
    marginTop: 2,
    border: "1px solid #B8AD99",
    borderRadius: 2,
  },
  paymentLabel: { fontSize: 10, fontWeight: 600 },
  paymentDesc: { fontSize: 9, color: "#7A6F5E", marginTop: 1, lineHeight: 1.25 },
});

function BrandLogo() {
  if (fs.existsSync(logoPath)) {
    // react-pdf's Image is not a DOM image and does not expose alt text.
    // eslint-disable-next-line jsx-a11y/alt-text
    return <Image src={logoPath} style={styles.logo} />;
  }
  return (
    <View>
      <Text style={{ color: "#E68011", fontSize: 19, fontWeight: 700 }}>TANHWE</Text>
      <Text style={{ color: "#054386", fontSize: 10, fontWeight: 600, letterSpacing: 1.5 }}>
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
            <Text style={[styles.muted, { textAlign: "right", fontSize: 8 }]}>
              {[town, region, country].filter(Boolean).join(", ")}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.documentType}>{data.type}</Text>
            <Text style={styles.documentNumber}>{data.number}</Text>
            <Text style={{ marginTop: 8, fontSize: 10 }}>
              Issued {data.createdAt.toLocaleDateString("en-NA")}
            </Text>
            {data.expiresAt && (
              <Text style={{ fontSize: 10 }}>
                Valid until {data.expiresAt.toLocaleDateString("en-NA")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Guest & Stay ── */}
        <View style={[styles.section, styles.row]}>
          <View>
            <Text style={styles.eyebrow}>GUEST</Text>
            <Text style={{ marginTop: 8, fontWeight: 600 }}>{snapshot.customer.name}</Text>
            <Text style={styles.muted}>{snapshot.customer.phone}</Text>
            {snapshot.customer.email && <Text style={styles.muted}>{snapshot.customer.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.eyebrow}>STAY</Text>
            {hasMixedRoomDates ? (
              <>
                <Text style={{ marginTop: 8 }}>Multiple room stays</Text>
                <Text style={styles.muted}>
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))} &middot;{" "}
                  {snapshot.bookingNumber}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ marginTop: 8 }}>
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkIn))} to{" "}
                  {formatDateOnly(dateToDateOnly(snapshot.stay.checkOut))}
                </Text>
                <Text style={styles.muted}>
                  {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"} &middot;{" "}
                  {snapshot.bookingNumber}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ── Room Table ── */}
        <View style={[styles.section, { marginTop: 22 }]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.grow, { width: "28%" }]}>Room</Text>
            <Text style={[styles.cell, { width: "18%" }]}>Dates</Text>
            <Text style={[styles.cell, { width: "12%" }]}>Rate</Text>
            <Text style={[styles.cell, { width: "12%" }]}>Rooms</Text>
            <Text style={[styles.cell, { width: "12%" }]}>Nights</Text>
            <Text style={[styles.cell, { width: "18%" }]}>Amount</Text>
          </View>
          {snapshot.rooms.map((room, index) => {
            const roomCheckIn = dateToDateOnly(room.checkIn ?? snapshot.stay.checkIn);
            const roomCheckOut = dateToDateOnly(room.checkOut ?? snapshot.stay.checkOut);
            const dates = `${formatDateOnly(roomCheckIn, { day: "numeric", month: "short" })} - ${formatDateOnly(roomCheckOut, { day: "numeric", month: "short" })}`;
            return (
              <View key={`${room.name}-${index}`} style={styles.tableRow}>
                <Text style={[styles.grow, { width: "28%" }]}>{room.name}</Text>
                <Text style={[styles.cell, { width: "18%", fontSize: 8, color: "#7A6F5E" }]}>
                  {dates}
                </Text>
                <Text style={[styles.cell, { width: "12%" }]}>{fmt(room.pricePerNight)}</Text>
                <Text style={[styles.cell, { width: "12%" }]}>{room.roomsCount}</Text>
                <Text style={[styles.cell, { width: "12%" }]}>{room.nights}</Text>
                <Text style={[styles.cell, { width: "18%" }]}>{fmt(room.subtotal)}</Text>
              </View>
            );
          })}
        </View>

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
          <View style={styles.totalRow}>
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
                <View style={{ flexDirection: "row", marginBottom: 7 }}>
                  <Text style={[styles.label, { width: 78 }]}>Account Name</Text>
                  <Text style={styles.value}>{bankingAccountName}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 7 }}>
                  <Text style={[styles.label, { width: 78 }]}>Account Number</Text>
                  <Text style={styles.mono}>{bankingAccountNumber}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 7 }}>
                  <Text style={[styles.label, { width: 78 }]}>Bank</Text>
                  <Text style={styles.value}>{bankingBankName}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 0 }}>
                  <Text style={[styles.label, { width: 78 }]}>Branch</Text>
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

        {/* ── Contact & Signature ── */}
        <View style={styles.contactRow}>
          <View style={styles.contactBlock}>
            <Text
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: "#7A6F5E",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Contact Us
            </Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>Phone: {primaryPhone}</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>Email: {businessEmail}</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>
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
                <Text style={{ fontSize: 10, fontWeight: 600, color: "#3D372E" }}>
                  {signatoryName}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "Allura",
                    fontSize: 20,
                    lineHeight: 1,
                    color: "#3D372E",
                    marginBottom: 4,
                    transform: "rotate(-4deg)",
                  }}
                >
                  {signatoryName}
                </Text>
              )}
              <Text style={{ fontSize: 10, fontWeight: 600, color: "#3D372E" }}>
                {signatoryName}
              </Text>
              <Text style={{ fontSize: 9, color: "#7A6F5E" }}>{signatoryRole}</Text>
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
                marginTop: 18,
                paddingTop: 12,
                borderTop: "1px solid #E6E0D3",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 9, color: "#059669" }}>✓</Text>
              <Text style={{ fontSize: 8, color: "#7A6F5E" }}>{secureFooterMessage}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6, gap: 16 }}>
              {acceptedPaymentTypes.split(",").map((type) => (
                <Text
                  key={type.trim()}
                  style={{ fontSize: 8, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1 }}
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
