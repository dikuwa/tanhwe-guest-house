import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Terms and Conditions | Tanhwe Guest House",
  description: "Terms and conditions for booking and staying at Tanhwe Guest House.",
};
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await getPublicSettings();
  const sections = [
    {
      title: "Booking requests and confirmation",
      content: "Submitting a booking request does not guarantee availability. All bookings are subject to confirmation by Tanhwe Guest House. A booking is only confirmed once the required deposit or confirmation has been received and acknowledged by our team.",
    },
    {
      title: "Deposits and payment",
      content: "Payment terms will be communicated during the booking process. Deposits may be required to secure a reservation. Full payment or a deposit may be requested depending on the type of booking and the arrangements made with our team.",
    },
    {
      title: "Check-in and check-out",
      content: `Check-in time is from ${settings.checkInTime} and check-out is by ${settings.checkOutTime} unless other arrangements have been confirmed in advance. Early check-in or late check-out may be available on request and subject to availability.`,
    },
    {
      title: "Cancellation and changes",
      content: "Cancellation and change requests should be communicated as early as possible. Changes are subject to availability and the specific terms communicated during booking confirmation. Please contact us directly for assistance.",
    },
    {
      title: "Guest conduct",
      content: "Guests are expected to conduct themselves in a respectful manner towards staff, other guests, and the property. Tanhwe Guest House reserves the right to refuse or terminate accommodation for behaviour that disrupts the comfort or safety of others.",
    },
    {
      title: "Room occupancy",
      content: "Each room has a maximum guest capacity as stated during booking. Exceeding the maximum occupancy may result in additional charges or refusal of accommodation.",
    },
    {
      title: "Damage or loss",
      content: "Guests are responsible for any damage caused to the property or its contents during their stay. Tanhwe Guest House reserves the right to charge for repair or replacement of damaged items.",
    },
    {
      title: "Conference facility use",
      content: "Conference facility bookings are subject to separate terms regarding capacity, setup, duration, and pricing. Please confirm all arrangements with our team when making a conference enquiry.",
    },
    {
      title: "Website information",
      content: "While we strive to keep room descriptions, rates, and availability accurate, information on this website is subject to change without notice. We recommend confirming details directly with us before making travel arrangements.",
    },
    {
      title: "Liability",
      content: "Tanhwe Guest House shall not be liable for any loss, damage or inconvenience arising from circumstances beyond our control, including but not limited to power outages, weather conditions, or force majeure events.",
    },
    {
      title: "Contact information",
      content: `For all booking enquiries, changes, or questions about these terms, please contact Tanhwe Guest House at ${settings.phone} or via WhatsApp at ${settings.whatsapp}.`,
    },
    {
      title: "Changes to terms",
      content: "Tanhwe Guest House reserves the right to update these terms and conditions at any time. Changes will be posted on this page.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-[color-mix(in_oklch,var(--secondary)_8%,var(--background))] px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-[1180px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Legal</p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Terms and Conditions
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              Please read these terms carefully before making a booking enquiry.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-heading text-xl font-bold text-neutral-800">{section.title}</h2>
                <p className="mt-3 leading-7 text-neutral-600">{section.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
