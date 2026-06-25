import { hashPassword } from "better-auth/crypto";
import { asc, eq, sql } from "drizzle-orm";
import { closeDb, getDb } from "./db";
import { accounts, customers, faqs, roles, roomAmenities, rooms, settings, testimonials, users } from "./db/schema";

async function seed() {
  const db = getDb();
  console.log("Starting database seed...");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters are required");
  }

  await db
    .insert(roles)
    .values([
      {
        id: "role_admin",
        name: "admin",
        description: "Manage rooms, bookings, customers and documents",
      },
      {
        id: "role_owner",
        name: "owner",
        description: "Full access including users and financial reports",
      },
      { id: "role_staff", name: "staff", description: "Operational booking and follow-up access" },
    ])
    .onConflictDoNothing();

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existingUser) {
    const userId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        name: "Tanhwe Owner",
        role: "owner",
      });
      await tx.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(password),
      });
    });
    console.log(`✓ Created owner account: ${email}`);
  } else {
    console.log(`✓ Owner account already exists: ${email}`);
  }

  await db
    .insert(rooms)
    .values([
      {
        id: "room_double",
        name: "Double Room",
        slug: "double-room",
        type: "double",
        description: "Comfortable double room with ensuite bathroom",
        pricePerNight: 500,
        availableUnits: 3,
        maxGuests: 2,
        breakfastIncluded: true,
      },
      {
        id: "room_single",
        name: "Single Room",
        slug: "single-room",
        type: "single",
        description: "Cozy single room for solo travellers",
        pricePerNight: 650,
        availableUnits: 2,
        maxGuests: 1,
        breakfastIncluded: true,
      },
      {
        id: "room_suite",
        name: "Executive Suite",
        slug: "executive-suite",
        type: "suite",
        description: "Suite with a living area and premium amenities",
        pricePerNight: 1200,
        availableUnits: 1,
        maxGuests: 4,
        breakfastIncluded: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(roomAmenities)
    .values([
      { id: "amenity_double_wifi", roomId: "room_double", amenity: "Wi-Fi", iconKey: "wifi" },
      {
        id: "amenity_double_breakfast",
        roomId: "room_double",
        amenity: "Breakfast included",
        iconKey: "coffee",
      },
      {
        id: "amenity_double_ensuite",
        roomId: "room_double",
        amenity: "Ensuite bathroom",
        iconKey: "bath",
      },
      { id: "amenity_single_wifi", roomId: "room_single", amenity: "Wi-Fi", iconKey: "wifi" },
      {
        id: "amenity_single_breakfast",
        roomId: "room_single",
        amenity: "Breakfast included",
        iconKey: "coffee",
      },
      {
        id: "amenity_single_ensuite",
        roomId: "room_single",
        amenity: "Ensuite bathroom",
        iconKey: "bath",
      },
      { id: "amenity_suite_wifi", roomId: "room_suite", amenity: "Wi-Fi", iconKey: "wifi" },
      {
        id: "amenity_suite_breakfast",
        roomId: "room_suite",
        amenity: "Breakfast included",
        iconKey: "coffee",
      },
      {
        id: "amenity_suite_lounge",
        roomId: "room_suite",
        amenity: "Private living area",
        iconKey: "sofa",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(settings)
    .values([
      {
        id: "setting_phone",
        key: "phone",
        value: "+264 81 380 8097",
        description: "Public phone number",
      },
      {
        id: "setting_whatsapp",
        key: "whatsapp",
        value: "+264 81 380 8097",
        description: "Public WhatsApp number",
      },
      {
        id: "setting_location",
        key: "location",
        value: "Mukwe, Namibia",
        description: "Public location",
      },
      {
        id: "setting_check_in",
        key: "check_in_time",
        value: "14:00",
        description: "Standard check-in time",
      },
      {
        id: "setting_check_out",
        key: "check_out_time",
        value: "10:00",
        description: "Standard check-out time",
      },
      { id: "setting_currency", key: "currency", value: "N$", description: "Display currency" },
      {
        id: "setting_email",
        key: "email",
        value: "info@tanhweguesthouse.com",
        description: "Public email address",
      },
      {
        id: "setting_time_format",
        key: "time_format",
        value: "24h",
        description: "Time display format (12h or 24h)",
      },
      {
        id: "setting_flextech_url",
        key: "flextech_url",
        value: "https://flextechmedia.com",
        description: "Flextech Media website URL for footer credit",
      },
      {
        id: "setting_location_pin_url",
        key: "location_pin_url",
        value: "",
        description: "Google Maps link or coordinates for location pin",
      },
      {
        id: "setting_whatsapp_location",
        key: "whatsapp_location_message",
        value:
          "Hello Tanhwe Guest House. I am planning to visit the guest house and would like to request the correct location pin and arrival directions. Thank you.",
        description: "WhatsApp message template for location pin request",
      },
      {
        id: "setting_whatsapp_conference",
        key: "whatsapp_conference_message",
        value:
          "Hello Tanhwe Guest House. I would like to enquire about the conference facility. Please send me availability and pricing information.",
        description: "WhatsApp message template for conference enquiry",
      },
      {
        id: "setting_business_name",
        key: "business_name",
        value: "Tanhwe Guest House",
        description: "Business name for documents",
      },
      {
        id: "setting_physical_address",
        key: "physical_address",
        value: "Mukwe, Kavango East, Namibia",
        description: "Physical address for documents",
      },
      {
        id: "setting_town",
        key: "town",
        value: "Mukwe",
        description: "Town for documents",
      },
      {
        id: "setting_region",
        key: "region",
        value: "Kavango East",
        description: "Region for documents",
      },
      {
        id: "setting_country",
        key: "country",
        value: "Namibia",
        description: "Country for documents",
      },
      {
        id: "setting_business_email",
        key: "business_email",
        value: "info@tanhweguesthouse.com",
        description: "Business email for documents",
      },
      {
        id: "setting_primary_phone",
        key: "primary_phone",
        value: "+264 81 380 8097",
        description: "Primary phone number for documents",
      },
      {
        id: "setting_website_url",
        key: "website_url",
        value: "https://tanhweguesthouse.com",
        description: "Website URL for documents",
      },
      {
        id: "setting_banking_account_name",
        key: "banking_account_name",
        value: "Tanhwe Guest House",
        description: "Bank account holder name",
      },
      {
        id: "setting_banking_account_number",
        key: "banking_account_number",
        value: "64292101381",
        description: "Bank account number",
      },
      {
        id: "setting_banking_bank_name",
        key: "banking_bank_name",
        value: "First National Bank",
        description: "Bank name",
      },
      {
        id: "setting_banking_branch_name",
        key: "banking_branch_name",
        value: "Rundu Branch",
        description: "Bank branch name",
      },
      {
        id: "setting_payment_bank_transfer_enabled",
        key: "payment_bank_transfer_enabled",
        value: "true",
        description: "Show bank transfer as payment method",
      },
      {
        id: "setting_payment_mobile_wallets_enabled",
        key: "payment_mobile_wallets_enabled",
        value: "true",
        description: "Show mobile wallets as payment method",
      },
      {
        id: "setting_payment_mobile_wallet_description",
        key: "payment_mobile_wallet_description",
        value: "We accept payments via Blue Wallet, eWallet, Easy Wallet and other wallets.",
        description: "Mobile wallet payment description",
      },
      {
        id: "setting_payment_supported_wallets",
        key: "payment_supported_wallets",
        value: "Blue Wallet, eWallet, Easy Wallet",
        description: "Comma-separated list of supported mobile wallets",
      },
      {
        id: "setting_document_manager_role_label",
        key: "document_manager_role_label",
        value: "Managing Director",
        description: "Title displayed under owner signature on documents",
      },
      {
        id: "setting_document_footer_text",
        key: "document_footer_text",
        value: "",
        description: "Optional footer text on documents",
      },
      {
        id: "setting_document_payment_visible",
        key: "document_payment_visible",
        value: "true",
        description: "Show payment methods on documents",
      },
      {
        id: "setting_document_banking_visible",
        key: "document_banking_visible",
        value: "true",
        description: "Show banking details on documents",
      },
      {
        id: "setting_document_signature_visible",
        key: "document_signature_visible",
        value: "true",
        description: "Show signature on documents",
      },
      {
        id: "setting_document_signature_image",
        key: "document_signature_image",
        value: "",
        description: "URL of uploaded signature image",
      },
      {
        id: "setting_document_signatory_name",
        key: "document_signatory_name",
        value: "Thomas Kamushambe",
        description: "Name displayed as document signatory",
      },
      {
        id: "setting_document_signatory_role",
        key: "document_signatory_role",
        value: "Managing Director",
        description: "Role/title of the document signatory",
      },
      {
        id: "setting_document_secure_footer_visible",
        key: "document_secure_footer_visible",
        value: "true",
        description: "Show secure payment footer on documents",
      },
      {
        id: "setting_document_secure_footer_message",
        key: "document_secure_footer_message",
        value: "Secure payments. All transactions are safe and encrypted.",
        description: "Message displayed in the secure payment footer",
      },
      {
        id: "setting_payment_bank_transfer_title",
        key: "payment_bank_transfer_title",
        value: "Bank Transfer",
        description: "Title for the bank transfer payment method",
      },
      {
        id: "setting_payment_bank_transfer_instructions",
        key: "payment_bank_transfer_instructions",
        value: "Pay via bank transfer using the details provided.",
        description: "Instructions shown for bank transfer payments",
      },
      {
        id: "setting_payment_mobile_wallets_title",
        key: "payment_mobile_wallets_title",
        value: "Mobile Wallets",
        description: "Title for the mobile wallets payment method",
      },
      {
        id: "setting_accepted_payment_types",
        key: "accepted_payment_types",
        value: "Visa,Mastercard,eWallet",
        description: "Comma-separated list of accepted payment card types",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(customers)
    .values({
      id: "customer_1",
      fullName: "Sample Customer",
      phone: "+264 81 000 0000",
      whatsapp: "+264 81 000 0000",
      email: "customer@example.com",
      notes: "Development seed record",
    })
    .onConflictDoNothing();

  // ── Seed FAQs only if none exist ──
  const existingFaqs = await db.select({ count: sql<number>`count(*)::int` }).from(faqs);
  if (existingFaqs[0]?.count === 0) {
    const faqData = [
      {
        question: "What time is check-in and check-out?",
        answer: "Check-in and check-out times are shown during booking and may also be confirmed directly with our team. Contact us in advance when you need an earlier arrival or later departure.",
        sortOrder: 1,
      },
      {
        question: "How do I confirm my room booking?",
        answer: "Select your preferred room and dates, submit your booking request and follow the confirmation instructions provided by Tanhwe Guest House. A booking is only confirmed once the required confirmation or deposit has been received.",
        sortOrder: 2,
      },
      {
        question: "Can I request the guest-house location pin?",
        answer: "Yes. Use the \"Request location pin\" button on the Contact page or your booking confirmation. WhatsApp will open with a prepared message so our team can send you the correct location.",
        sortOrder: 3,
      },
      {
        question: "Does Tanhwe Guest House offer conference facilities?",
        answer: "Yes. We have one conference facility suitable for meetings, workshops, training sessions and small events. Contact us for capacity, availability, seating setup and pricing.",
        sortOrder: 4,
      },
      {
        question: "Can I book more than one room?",
        answer: "Yes. Where availability allows, guests can request multiple rooms. The total will be calculated using the room rate, number of rooms and number of nights.",
        sortOrder: 5,
      },
      {
        question: "How can I contact Tanhwe Guest House?",
        answer: "You can contact us by phone or WhatsApp using the details shown throughout the website. WhatsApp is recommended for booking questions, directions and arrival arrangements.",
        sortOrder: 6,
      },
      {
        question: "Can I change or cancel a booking?",
        answer: "Contact the guest house as early as possible. Changes and cancellations are subject to room availability and the booking terms communicated during confirmation.",
        sortOrder: 7,
      },
      {
        question: "Are children and families welcome?",
        answer: "Yes. Families are welcome. Please include the correct number of guests when making an enquiry so the team can recommend the most suitable room arrangement.",
        sortOrder: 8,
      },
    ];
    await db.insert(faqs).values(faqData.map((f) => ({ id: crypto.randomUUID(), ...f })));
    console.log(`✓ Seeded ${faqData.length} FAQs`);
  }

  // ── Seed Testimonials only if none exist ──
  const existingTestimonials = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(testimonials);
  if (existingTestimonials[0]?.count === 0) {
    const testimonialData = [
      {
        guestName: "Selma N.",
        guestType: "Business traveller",
        text: "The room was clean, comfortable and peaceful. The team made our arrival easy and responded quickly whenever we needed assistance.",
        sortOrder: 1,
        featured: true,
      },
      {
        guestName: "Petrus K.",
        guestType: "Leisure guest",
        text: "We stayed at Tanhwe Guest House while visiting Mukwe and felt welcome from the moment we arrived. The booking process was simple and the room had everything we needed.",
        sortOrder: 2,
        featured: true,
      },
      {
        guestName: "Maria H.",
        guestType: "Conference organiser",
        text: "Our small team used the conference facility for a planning session. The space was practical, well prepared and convenient for everyone attending.",
        sortOrder: 3,
        featured: true,
      },
      {
        guestName: "Johannes M.",
        guestType: "Returning guest",
        text: "The WhatsApp communication was very helpful. We received clear booking information and the location pin before travelling.",
        sortOrder: 4,
      },
      {
        guestName: "Anna S.",
        guestType: "Family guest",
        text: "A comfortable place for an overnight stay. The staff were friendly, the surroundings were quiet and we would gladly stay again.",
        sortOrder: 5,
      },
      {
        guestName: "David N.",
        guestType: "Work traveller",
        text: "Tanhwe Guest House gave us a simple and reliable base during our work trip. The room was neat and the service was professional.",
        sortOrder: 6,
      },
    ];
    await db
      .insert(testimonials)
      .values(
        testimonialData.map((t) => ({
          id: crypto.randomUUID(),
          ...t,
        }))
      );
    console.log(`✓ Seeded ${testimonialData.length} testimonials`);
  }

  console.log("✅ Database seed completed successfully");
}

seed()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
