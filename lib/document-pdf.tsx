import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

const alluraFontPath = path.join(process.cwd(), "public", "fonts", "Allura-Regular.ttf");
if (fs.existsSync(alluraFontPath)) {
  Font.register({ family: "Allura", src: alluraFontPath });
}

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
  primaryPhone: string;
  businessEmail: string;
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
  mobileWalletsEnabled: boolean;
  mobileWalletDescription: string;
  managerRoleLabel: string;
  signatureImage: string;
  footerText: string;
  paymentVisible: boolean;
  ownerName: string;
};

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", color: "#172033", fontSize: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  brandName: { color: "#E68011", fontSize: 19, fontWeight: 700, letterSpacing: -0.5 },
  brandSub: { color: "#054386", fontSize: 10, fontWeight: 600, letterSpacing: 1.5 },
  title: { fontSize: 18, fontWeight: 700, textTransform: "uppercase" },
  muted: { color: "#667085", marginTop: 5 },
  section: { marginTop: 24, paddingTop: 16, borderTop: "1px solid #E5E7EB" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F5F1E8", padding: 9, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 9, borderBottom: "1px solid #E5E7EB" },
  grow: { width: "42%" },
  cell: { width: "14.5%", textAlign: "right" },
  totals: { marginTop: 22, marginLeft: "55%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  balance: { color: "#0D5CA8", fontWeight: 700, fontSize: 12 },
  cardsRow: { flexDirection: "row", marginTop: 22, gap: 12 },
  card: { flex: 1, border: "1px solid #E5E7EB", borderRadius: 4, padding: 12 },
  cardTitle: { fontSize: 9, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  label: { fontSize: 9, color: "#667085", marginBottom: 1 },
  value: { fontSize: 10, marginBottom: 6 },
  mono: { fontSize: 10, fontFamily: "Courier", marginBottom: 6 },
  contactRow: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTop: "1px solid #E5E7EB" },
  contactBlock: { flex: 1 },
  ownerBlock: { flex: 1, alignItems: "flex-end" },
  footer: { marginTop: 20, textAlign: "center", fontSize: 8, color: "#667085", borderTop: "1px solid #E5E7EB", paddingTop: 12 },
  closing: { marginTop: 16, textAlign: "center", fontSize: 10, color: "#667085" },
  paymentItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  paymentIcon: { width: 14, fontSize: 10, color: "#999" },
  paymentLabel: { fontSize: 10, fontWeight: 700 },
  paymentDesc: { fontSize: 9, color: "#667085", marginTop: 1 },
});

function BrandLogo() {
  return (
    <View>
      <Text style={styles.brandName}>TANHWE</Text>
      <Text style={styles.brandSub}>GUEST HOUSE</Text>
    </View>
  );
}

export async function createDocumentPdf(data: PdfData, settings?: DocSettings) {
  const snapshot = JSON.parse(data.snapshot) as Snapshot;
  const {
    businessName = "Tanhwe Guest House",
    location = "Mukwe, Namibia",
    currency = "N$",
    bankingAccountName = "",
    bankingAccountNumber = "",
    bankingBankName = "",
    bankingBranchName = "",
    bankingBranchCode = "",
    bankingAccountType = "",
    bankingSwiftBic = "",
    bankTransferEnabled = false,
    mobileWalletsEnabled = false,
    mobileWalletDescription = "",
    managerRoleLabel = "Managing Director",
    footerText = "",
    paymentVisible = true,
    primaryPhone = "",
    businessEmail = "",
    physicalAddress = "",
    ownerName = "",
  } = settings ?? {
    businessName: "Tanhwe Guest House",
    location: "Mukwe, Namibia",
    currency: "N$",
    bankTransferEnabled: false,
    mobileWalletsEnabled: false,
    mobileWalletDescription: "",
    managerRoleLabel: "Managing Director",
    footerText: "",
    paymentVisible: true,
    primaryPhone: "",
    businessEmail: "",
    physicalAddress: "",
    ownerName: "",
    bankingAccountName: "",
    bankingAccountNumber: "",
    bankingBankName: "",
    bankingBranchName: "",
    bankingBranchCode: "",
    bankingAccountType: "",
    bankingSwiftBic: "",
  };
  const fmt = (value: number) => `${currency} ${value.toFixed(2)}`;

  return renderToBuffer(
    <Document title={`${data.type} ${data.number}`}>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.row}>
          <View>
            <BrandLogo />
            <Text style={styles.muted}>{location}</Text>
          </View>
          <View>
            <Text style={styles.title}>{data.type}</Text>
            <Text>{data.number}</Text>
            <Text style={styles.muted}>Issued {data.createdAt.toLocaleDateString("en-NA")}</Text>
            {data.expiresAt && (
              <Text style={styles.muted}>
                Valid until {data.expiresAt.toLocaleDateString("en-NA")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Guest & Stay ── */}
        <View style={[styles.section, styles.row]}>
          <View>
            <Text>GUEST</Text>
            <Text style={{ marginTop: 7, fontWeight: 700 }}>{snapshot.customer.name}</Text>
            <Text style={styles.muted}>{snapshot.customer.phone}</Text>
            {snapshot.customer.email && <Text style={styles.muted}>{snapshot.customer.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>STAY</Text>
            <Text style={{ marginTop: 7 }}>
              {new Date(snapshot.stay.checkIn).toLocaleDateString("en-NA")} to{" "}
              {new Date(snapshot.stay.checkOut).toLocaleDateString("en-NA")}
            </Text>
            <Text style={styles.muted}>
              {snapshot.stay.nights} night{snapshot.stay.nights === 1 ? "" : "s"} &middot;{" "}
              {snapshot.bookingNumber}
            </Text>
          </View>
        </View>

        {/* ── Room Table ── */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.grow}>Room</Text>
            <Text style={styles.cell}>Rate</Text>
            <Text style={styles.cell}>Rooms</Text>
            <Text style={styles.cell}>Nights</Text>
            <Text style={styles.cell}>Amount</Text>
          </View>
          {snapshot.rooms.map((room, index) => (
            <View key={`${room.name}-${index}`} style={styles.tableRow}>
              <Text style={styles.grow}>{room.name}</Text>
              <Text style={styles.cell}>{fmt(room.pricePerNight)}</Text>
              <Text style={styles.cell}>{room.roomsCount}</Text>
              <Text style={styles.cell}>{room.nights}</Text>
              <Text style={styles.cell}>{fmt(room.subtotal)}</Text>
            </View>
          ))}
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
          <View style={styles.totalRow}>
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
        {paymentVisible && (
          <View style={styles.cardsRow}>
            {bankTransferEnabled && bankingAccountName && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Banking Details</Text>
                <Text style={styles.label}>Account Name</Text>
                <Text style={styles.value}>{bankingAccountName}</Text>
                {bankingAccountNumber && (
                  <>
                    <Text style={styles.label}>Account Number</Text>
                    <Text style={styles.mono}>{bankingAccountNumber}</Text>
                  </>
                )}
                {bankingBankName && (
                  <>
                    <Text style={styles.label}>Bank</Text>
                    <Text style={styles.value}>{bankingBankName}</Text>
                  </>
                )}
                {bankingBranchName && (
                  <>
                    <Text style={styles.label}>Branch</Text>
                    <Text style={styles.value}>{bankingBranchName}</Text>
                  </>
                )}
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
                    <Text style={styles.mono}>{bankingSwiftBic}</Text>
                  </>
                )}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Methods</Text>
              {bankTransferEnabled && (
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentIcon}>&#x1F3E6;</Text>
                  <View>
                    <Text style={styles.paymentLabel}>Bank Transfer</Text>
                    <Text style={styles.paymentDesc}>
                      Pay via bank transfer using the details provided.
                    </Text>
                  </View>
                </View>
              )}
              {mobileWalletsEnabled && (
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentIcon}>&#x1F4B3;</Text>
                  <View>
                    <Text style={styles.paymentLabel}>Mobile Wallets</Text>
                    <Text style={styles.paymentDesc}>{mobileWalletDescription}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Contact & Signature ── */}
        <View style={styles.contactRow}>
          <View style={styles.contactBlock}>
            <Text style={{ fontSize: 9, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Contact Us
            </Text>
            {primaryPhone && <Text style={{ fontSize: 10, marginBottom: 2 }}>{primaryPhone}</Text>}
            {businessEmail && <Text style={{ fontSize: 10, marginBottom: 2 }}>{businessEmail}</Text>}
            {physicalAddress && <Text style={{ fontSize: 10, marginBottom: 2 }}>{physicalAddress}</Text>}
          </View>
          {ownerName && (
            <View style={styles.ownerBlock}>
              <Text
                style={{
                  fontFamily: "Allura",
                  fontSize: 28,
                  lineHeight: 0.9,
                  letterSpacing: -0.5,
                  color: "#2C2C2C",
                  marginBottom: 4,
                }}
              >
                {ownerName}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: 700, color: "#1C1C1C" }}>{ownerName}</Text>
              <Text style={{ fontSize: 9, color: "#667085" }}>{managerRoleLabel}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        {footerText && (
          <Text style={styles.footer}>{footerText}</Text>
        )}

        {/* ── Closing ── */}
        <Text style={styles.closing}>
          Thank you for choosing {businessName}.
        </Text>
      </Page>
    </Document>
  );
}
