import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

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
const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", color: "#172033", fontSize: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  brand: { color: "#0D5CA8", fontSize: 19, fontWeight: 700 },
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
});
const nad = (value: number) => `N$ ${value.toFixed(2)}`;

export async function createDocumentPdf(data: PdfData) {
  const snapshot = JSON.parse(data.snapshot) as Snapshot;
  return renderToBuffer(
    <Document title={`${data.type} ${data.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            <Text style={styles.brand}>Tanhwe Guest House</Text>
            <Text style={styles.muted}>Mukwe, Namibia</Text>
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
        <View style={[styles.section, styles.row]}>
          <View>
            <Text>GUEST</Text>
            <Text style={{ marginTop: 7, fontWeight: 700 }}>{snapshot.customer.name}</Text>
            <Text style={styles.muted}>{snapshot.customer.phone}</Text>
            {snapshot.customer.email && <Text style={styles.muted}>{snapshot.customer.email}</Text>}
          </View>
          <View>
            <Text>STAY</Text>
            <Text style={{ marginTop: 7 }}>
              {new Date(snapshot.stay.checkIn).toLocaleDateString("en-NA")} to{" "}
              {new Date(snapshot.stay.checkOut).toLocaleDateString("en-NA")}
            </Text>
            <Text style={styles.muted}>
              {snapshot.stay.nights} nights · {snapshot.bookingNumber}
            </Text>
          </View>
        </View>
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
              <Text style={styles.cell}>{nad(room.pricePerNight)}</Text>
              <Text style={styles.cell}>{room.roomsCount}</Text>
              <Text style={styles.cell}>{room.nights}</Text>
              <Text style={styles.cell}>{nad(room.subtotal)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{nad(snapshot.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Extras</Text>
            <Text>{nad(snapshot.extras)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>- {nad(snapshot.discount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total</Text>
            <Text>{nad(snapshot.total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Paid</Text>
            <Text>{nad(snapshot.amountPaid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.balance}>Balance due</Text>
            <Text style={styles.balance}>{nad(snapshot.balanceDue)}</Text>
          </View>
        </View>
        <Text style={[styles.muted, { marginTop: 36 }]}>
          Thank you for choosing Tanhwe Guest House.
        </Text>
      </Page>
    </Document>
  );
}
