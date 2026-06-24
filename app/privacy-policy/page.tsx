import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSettings } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Privacy Policy | Tanhwe Guest House",
  description: "How Tanhwe Guest House collects, uses and protects your personal information.",
};
export const dynamic = "force-dynamic";

export default async function PrivacyPolicyPage() {
  const settings = await getPublicSettings();
  const sections = [
    {
      title: "Information we collect",
      content: "We collect information you provide when making a booking enquiry or contacting us. This may include your full name, phone number, WhatsApp number, email address, booking dates, room preferences, and any additional information you choose to share with us.",
    },
    {
      title: "How we use your information",
      content: "Your information is used to process booking requests, prepare quotations and receipts, communicate with you about your stay, and provide the services you request. We may use your contact details to send booking confirmations, reminders, and information about your upcoming stay.",
    },
    {
      title: "Communication",
      content: "We communicate with guests by phone, email and WhatsApp. By providing your contact details, you consent to being contacted regarding your booking enquiry, reservation, and stay at our facility.",
    },
    {
      title: "Cookies and analytics",
      content: "Our website uses basic cookies to improve functionality and may use website analytics to understand how visitors use our site. This helps us improve the user experience. You can adjust your browser settings to refuse cookies.",
    },
    {
      title: "Data storage and protection",
      content: "Your data is stored securely and accessed only by authorised staff. We take reasonable precautions to protect your personal information from unauthorised access, alteration, or disclosure.",
    },
    {
      title: "Data retention",
      content: "We retain your booking and contact information for legitimate business purposes, including financial record-keeping and historical reference. Records are retained as required by applicable laws.",
    },
    {
      title: "Your rights",
      content: "You have the right to request access to the personal information we hold about you, request corrections, or ask that we delete your information where appropriate. To exercise these rights, please contact us using the details on our Contact page.",
    },
    {
      title: "Third-party services",
      content: "We may use third-party services for website hosting, analytics, and communication tools. These service providers have their own privacy policies governing the use of your data.",
    },
    {
      title: "Policy updates",
      content: "We may update this privacy policy from time to time. Changes will be posted on this page. We encourage you to review this policy periodically.",
    },
    {
      title: "Contact us",
      content: `If you have questions about this privacy policy or how your data is handled, please contact us at ${settings.phone} or via WhatsApp at ${settings.whatsapp}.`,
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
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              How Tanhwe Guest House collects, uses and protects your personal information.
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
