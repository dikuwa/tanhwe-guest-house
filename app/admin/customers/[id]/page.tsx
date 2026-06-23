import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { CustomerForm } from "@/components/admin/customer-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerProfile } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";

const money = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD" });

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["owner", "admin", "staff"]);
  const profile = await getCustomerProfile((await params).id);
  if (!profile) notFound();
  const { customer, history } = profile;
  const phone = customer.phone.replace(/[^+\d]/g, "");
  const whatsapp = customer.whatsapp.replace(/\D/g, "");
  const upcoming = history.filter(
    (booking) => booking.checkIn >= new Date() && !["cancelled", "no-show"].includes(booking.status)
  ).length;
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/admin/customers" />}>
        <ArrowLeft />
        Customers
      </Button>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{customer.fullName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {history.length} total stays · {upcoming} upcoming
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<a href={`tel:${phone}`} />}>
            <Phone />
            Call
          </Button>
          <Button
            variant="outline"
            render={<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" />}
          >
            <MessageCircle />
            WhatsApp
          </Button>
        </div>
      </header>
      {session.user.role !== "staff" ? (
        <CustomerForm customer={customer} />
      ) : (
        <div className="rounded-xl border bg-card p-5 text-sm">
          <p>
            <span className="text-muted-foreground">Phone:</span> {customer.phone}
          </p>
          <p className="mt-2">
            <span className="text-muted-foreground">Email:</span> {customer.email || "Not provided"}
          </p>
          {customer.notes && <p className="mt-4 whitespace-pre-wrap">{customer.notes}</p>}
        </div>
      )}
      <section>
        <h2 className="text-lg font-semibold">Booking history</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Stay</th>
                <th className="px-4 py-3">Status</th>
                {session.user.role !== "staff" && (
                  <>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Balance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {history.map((booking) => (
                <tr key={booking.id} className="border-b last:border-0">
                  <td className="px-4 py-4 font-medium">{booking.bookingNumber}</td>
                  <td className="px-4 py-4">
                    {booking.rooms.map((room) => room.roomNameSnapshot).join(", ")}
                  </td>
                  <td className="px-4 py-4">
                    {booking.checkIn.toLocaleDateString("en-NA")} to{" "}
                    {booking.checkOut.toLocaleDateString("en-NA")}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="capitalize">
                      {booking.status}
                    </Badge>
                  </td>
                  {session.user.role !== "staff" && (
                    <>
                      <td className="px-4 py-4 tabular-nums">{money.format(booking.total)}</td>
                      <td className="px-4 py-4 tabular-nums">{money.format(booking.balanceDue)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No booking history yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
