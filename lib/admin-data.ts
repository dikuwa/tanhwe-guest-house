import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  blocks,
  bookingRooms,
  bookings,
  customers,
  documents,
  followUps,
  folioItems,
  roomTypes,
  rooms,
  roomUnits,
  users,
  settings,
  shareLinks,
} from "./db/schema";

export async function getAdminRooms() {
  return getDb().query.rooms.findMany({
    orderBy: [asc(rooms.name)],
    with: { images: true, amenities: true },
  });
}

export async function getAdminRoom(id: string) {
  return getDb().query.rooms.findFirst({
    where: eq(rooms.id, id),
    with: { images: true, amenities: true },
  });
}

export async function getAdminBookings() {
  return getDb().query.bookings.findMany({
    orderBy: [desc(bookings.createdAt)],
    with: { customer: true, rooms: true },
    limit: 250,
  });
}

export async function getDashboardData() {
  const db = getDb();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const [
    [roomCount],
    [pendingCount],
    [upcomingCount],
    [financials],
    [checkIns],
    [checkOuts],
    recent,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(rooms)
      .where(eq(rooms.status, "active")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, "pending")),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(gte(bookings.checkIn, today)),
    db
      .select({
        received: sql<number>`coalesce(sum(${bookings.amountPaid}), 0)::int`,
        outstanding: sql<number>`coalesce(sum(${bookings.balanceDue}), 0)::int`,
      })
      .from(bookings),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(gte(bookings.checkIn, today), lte(bookings.checkIn, nextWeek))),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(gte(bookings.checkOut, today), lte(bookings.checkOut, nextWeek))),
    db
      .select({
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        status: bookings.status,
        checkIn: bookings.checkIn,
        total: bookings.total,
        fullName: customers.fullName,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .orderBy(desc(bookings.createdAt))
      .limit(6),
  ]);
  return {
    activeRooms: roomCount.value,
    pendingBookings: pendingCount.value,
    upcomingBookings: upcomingCount.value,
    revenueReceived: financials.received,
    outstanding: financials.outstanding,
    checkIns: checkIns.value,
    checkOuts: checkOuts.value,
    recent,
  };
}

export async function getActiveRoomTypes() {
  return getDb()
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.status, "active"))
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.name));
}

export async function getAdminRoomTypes() {
  return getDb()
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      slug: roomTypes.slug,
      description: roomTypes.description,
      bedConfiguration: roomTypes.bedConfiguration,
      pricePerNight: roomTypes.pricePerNight,
      maxGuests: roomTypes.maxGuests,
      breakfastIncluded: roomTypes.breakfastIncluded,
      sortOrder: roomTypes.sortOrder,
      status: roomTypes.status,
    })
    .from(roomTypes)
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.name));
}

export async function getAdminRoomUnits(roomId?: string) {
  const conditions = [];
  if (roomId) conditions.push(eq(roomUnits.roomId, roomId));
  return getDb()
    .select()
    .from(roomUnits)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(roomUnits.block), asc(roomUnits.roomNumber));
}

export async function getAdminBlocks() {
  return getDb()
    .select({
      id: blocks.id,
      name: blocks.name,
      shortCode: blocks.shortCode,
      description: blocks.description,
      displayOrder: blocks.displayOrder,
      isActive: blocks.isActive,
      roomUnitCount: sql<number>`coalesce(count(${roomUnits.id}) filter (where ${roomUnits.isActive} = true), 0)::int`,
    })
    .from(blocks)
    .leftJoin(roomUnits, eq(roomUnits.blockId, blocks.id))
    .groupBy(blocks.id)
    .orderBy(asc(blocks.displayOrder), asc(blocks.name));
}

export async function getActiveRoomOptions() {
  const rows = await getDb()
    .select({
      id: rooms.id,
      name: rooms.name,
      pricePerNight: rooms.pricePerNight,
      maxGuests: rooms.maxGuests,
      availableUnits: rooms.availableUnits,
    })
    .from(rooms)
    .where(eq(rooms.status, "active"))
    .orderBy(asc(rooms.name));

  // Enrich with actual available room unit counts
  const roomIds = rows.map((r) => r.id);
  if (roomIds.length === 0) return rows;

  const unitCounts = await getDb()
    .select({
      roomId: roomUnits.roomId,
      count: sql<number>`count(*)::int`,
    })
    .from(roomUnits)
    .where(
      and(
        inArray(roomUnits.roomId, roomIds),
        eq(roomUnits.isActive, true),
        inArray(roomUnits.operationalStatus, ["available", "cleaning"])
      )
    )
    .groupBy(roomUnits.roomId);

  const countMap = new Map(unitCounts.map((uc) => [uc.roomId, uc.count]));
  return rows.map((row) => ({
    ...row,
    availableUnits: countMap.get(row.id) ?? row.availableUnits,
  }));
}

export async function getCustomers(
  options: { query?: string; page?: number; pageSize?: number } = {}
) {
  const query = options.query?.trim() ?? "";
  const pageSize = Math.min(Math.max(options.pageSize ?? 25, 1), 100);
  const page = Math.max(options.page ?? 1, 1);
  const where = query
    ? or(
        ilike(customers.fullName, `%${query}%`),
        ilike(customers.phone, `%${query}%`),
        ilike(customers.whatsapp, `%${query}%`),
        ilike(customers.email, `%${query}%`)
      )
    : undefined;
  const [rows, [total]] = await Promise.all([
    getDb()
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        whatsapp: customers.whatsapp,
        email: customers.email,
        updatedAt: customers.updatedAt,
        totalStays: sql<number>`count(${bookings.id})::int`,
        totalBooked: sql<number>`coalesce(sum(${bookings.total}), 0)::int`,
        outstanding: sql<number>`coalesce(sum(${bookings.balanceDue}), 0)::int`,
      })
      .from(customers)
      .leftJoin(bookings, eq(bookings.customerId, customers.id))
      .where(where)
      .groupBy(customers.id)
      .orderBy(desc(customers.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    getDb()
      .select({ value: sql<number>`count(*)::int` })
      .from(customers)
      .where(where),
  ]);
  return {
    rows,
    total: total.value,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total.value / pageSize)),
  };
}

export async function getCustomerProfile(id: string) {
  const customer = await getDb().query.customers.findFirst({ where: eq(customers.id, id) });
  if (!customer) return null;
  const history = await getDb().query.bookings.findMany({
    where: eq(bookings.customerId, id),
    orderBy: [desc(bookings.checkIn)],
    with: { rooms: true },
  });
  return { customer, history };
}

export async function getDuplicateCustomerCandidates() {
  const result = await getDb().execute<{
    matchType: string;
    identifier: string;
    ids: string[];
    names: string[];
  }>(sql`
    select 'phone' as "matchType", regexp_replace(phone, '[^0-9]', '', 'g') as identifier,
      array_agg(id) as ids, array_agg(full_name order by full_name) as names
    from customers
    where length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 7
    group by regexp_replace(phone, '[^0-9]', '', 'g') having count(*) > 1
    union all
    select 'email' as "matchType", lower(email) as identifier,
      array_agg(id) as ids, array_agg(full_name order by full_name) as names
    from customers where email is not null and email <> ''
    group by lower(email) having count(*) > 1
    limit 20
  `);
  return Array.from(result);
}

export async function getDocumentRegister() {
  return getDb()
    .select({
      id: documents.id,
      number: documents.number,
      type: documents.type,
      status: documents.status,
      total: documents.total,
      amountPaid: documents.amountPaid,
      balanceDue: documents.balanceDue,
      expiresAt: documents.expiresAt,
      createdAt: documents.createdAt,
      bookingNumber: bookings.bookingNumber,
      customerName: customers.fullName,
    })
    .from(documents)
    .innerJoin(bookings, eq(documents.bookingId, bookings.id))
    .innerJoin(customers, eq(documents.customerId, customers.id))
    .orderBy(desc(documents.createdAt));
}

export async function getDocument(id: string) {
  const [document] = await getDb()
    .select({
      id: documents.id,
      number: documents.number,
      type: documents.type,
      status: documents.status,
      total: documents.total,
      amountPaid: documents.amountPaid,
      balanceDue: documents.balanceDue,
      snapshot: documents.snapshot,
      expiresAt: documents.expiresAt,
      createdAt: documents.createdAt,
      bookingNumber: bookings.bookingNumber,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerEmail: customers.email,
    })
    .from(documents)
    .innerJoin(bookings, eq(documents.bookingId, bookings.id))
    .innerJoin(customers, eq(documents.customerId, customers.id))
    .where(eq(documents.id, id));
  return document ?? null;
}

export async function getDocumentBookingOptions() {
  return getDb()
    .select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      customerName: customers.fullName,
      total: bookings.total,
      balanceDue: bookings.balanceDue,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      or(
        eq(bookings.status, "pending"),
        eq(bookings.status, "confirmed"),
        eq(bookings.status, "checked-in")
      )
    )
    .orderBy(desc(bookings.createdAt));
}

export async function getFollowUps(options: { assignedTo?: string } = {}) {
  return getDb()
    .select({
      id: followUps.id,
      type: followUps.type,
      title: followUps.title,
      notes: followUps.notes,
      dueDate: followUps.dueDate,
      status: followUps.status,
      priority: followUps.priority,
      bookingId: followUps.bookingId,
      customerId: followUps.customerId,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerWhatsapp: customers.whatsapp,
      assigneeName: users.name,
    })
    .from(followUps)
    .leftJoin(customers, eq(followUps.customerId, customers.id))
    .leftJoin(users, eq(followUps.assignedTo, users.id))
    .where(options.assignedTo ? eq(followUps.assignedTo, options.assignedTo) : undefined)
    .orderBy(asc(followUps.status), asc(followUps.dueDate));
}

export async function getFollowUpOptions() {
  const [customerOptions, bookingOptions, staffOptions] = await Promise.all([
    getDb()
      .select({ id: customers.id, label: customers.fullName })
      .from(customers)
      .orderBy(asc(customers.fullName)),
    getDb()
      .select({
        id: bookings.id,
        label: bookings.bookingNumber,
        customerId: bookings.customerId,
        customerName: customers.fullName,
        checkIn: bookings.checkIn,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .orderBy(desc(bookings.createdAt))
      .limit(250),
    getDb().select({ id: users.id, label: users.name }).from(users).orderBy(asc(users.name)),
  ]);
  return { customerOptions, bookingOptions, staffOptions };
}

export async function getReports(from: Date, to: Date) {
  const db = getDb();
  const dateWhere = and(gte(bookings.checkIn, from), lte(bookings.checkIn, to));
  const [[summary], [inventory], byStatus, bySource, roomPerformance, arrivals, departures] =
    await Promise.all([
      db
        .select({
          bookings: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${bookings.amountPaid}), 0)::int`,
          bookedValue: sql<number>`coalesce(sum(${bookings.total}), 0)::int`,
          outstanding: sql<number>`coalesce(sum(${bookings.balanceDue}), 0)::int`,
          roomNights: sql<number>`coalesce(sum(${bookings.nights}), 0)::int`,
        })
        .from(bookings)
        .where(dateWhere),
      db
        .select({ units: sql<number>`coalesce(count(*), 0)::int` })
        .from(roomUnits)
        .innerJoin(rooms, eq(roomUnits.roomId, rooms.id))
        .where(
          and(
            eq(rooms.status, "active"),
            eq(roomUnits.isActive, true),
            inArray(roomUnits.operationalStatus, ["available", "cleaning"])
          )
        ),
      db
        .select({ label: bookings.status, value: sql<number>`count(*)::int` })
        .from(bookings)
        .where(dateWhere)
        .groupBy(bookings.status)
        .orderBy(desc(sql`count(*)`)),
      db
        .select({ label: bookings.source, value: sql<number>`count(*)::int` })
        .from(bookings)
        .where(dateWhere)
        .groupBy(bookings.source)
        .orderBy(desc(sql`count(*)`)),
      db
        .select({
          room: bookingRooms.roomNameSnapshot,
          stays: sql<number>`count(*)::int`,
          roomNights: sql<number>`coalesce(sum(${bookingRooms.nights} * ${bookingRooms.roomsCount}), 0)::int`,
          value: sql<number>`coalesce(sum(${bookingRooms.subtotal}), 0)::int`,
        })
        .from(bookingRooms)
        .innerJoin(bookings, eq(bookingRooms.bookingId, bookings.id))
        .where(dateWhere)
        .groupBy(bookingRooms.roomNameSnapshot)
        .orderBy(desc(sql`sum(${bookingRooms.subtotal})`)),
      db
        .select({
          id: bookings.id,
          bookingNumber: bookings.bookingNumber,
          date: bookings.checkIn,
          guest: customers.fullName,
        })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .where(and(gte(bookings.checkIn, new Date()), lte(bookings.checkIn, to)))
        .orderBy(asc(bookings.checkIn))
        .limit(20),
      db
        .select({
          id: bookings.id,
          bookingNumber: bookings.bookingNumber,
          date: bookings.checkOut,
          guest: customers.fullName,
        })
        .from(bookings)
        .innerJoin(customers, eq(bookings.customerId, customers.id))
        .where(and(gte(bookings.checkOut, new Date()), lte(bookings.checkOut, to)))
        .orderBy(asc(bookings.checkOut))
        .limit(20),
    ]);
  summary.roomNights = roomPerformance.reduce((total, room) => total + room.roomNights, 0);
  return {
    summary,
    activeUnits: inventory.units,
    byStatus,
    bySource,
    roomPerformance,
    arrivals,
    departures,
  };
}

export async function getAdminSettings() {
  return getDb().select().from(settings).orderBy(asc(settings.key));
}

export async function getUsers() {
  return getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      image: users.image,
      jobTitle: users.jobTitle,
      phone: users.phone,
      permissionGrants: users.permissionGrants,
      permissionRestrictions: users.permissionRestrictions,
      disabledAt: users.disabledAt,
      disabledReason: users.disabledReason,
      revokedAt: users.revokedAt,
      revokedReason: users.revokedReason,
      lockedAt: users.lockedAt,
      lockedReason: users.lockedReason,
      lastLoginAt: users.lastLoginAt,
      deletedAt: users.deletedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));
}

export async function getOwnerProfile() {
  const [owner] = await getDb()
    .select({ id: users.id, name: users.name, image: users.image })
    .from(users)
    .where(eq(users.role, "owner"))
    .limit(1);
  return owner ?? null;
}

export async function getAdminFolioItems() {
  return getDb()
    .select()
    .from(folioItems)
    .orderBy(asc(folioItems.sortOrder), asc(folioItems.name));
}

export async function getActiveFolioItems() {
  return getDb()
    .select()
    .from(folioItems)
    .where(eq(folioItems.status, "active"))
    .orderBy(asc(folioItems.sortOrder), asc(folioItems.name));
}

export async function getDocumentSettings() {
  const values = await getDb().select().from(settings);
  const map = new Map(values.map((item) => [item.key, item.value]));
  return {
    businessName: map.get("business_name") ?? "Tanhwe Guest House",
    physicalAddress: map.get("physical_address") ?? "",
    town: map.get("town") ?? "",
    region: map.get("region") ?? "",
    country: map.get("country") ?? "",
    businessEmail: map.get("business_email") ?? "",
    primaryPhone: map.get("primary_phone") ?? "",
    websiteUrl: map.get("website_url") ?? "",
    logoUrl: map.get("logo_url") ?? "",
    bankingAccountName: map.get("banking_account_name") ?? "",
    bankingAccountNumber: map.get("banking_account_number") ?? "",
    bankingBankName: map.get("banking_bank_name") ?? "",
    bankingBranchName: map.get("banking_branch_name") ?? "",
    bankingBranchCode: map.get("banking_branch_code") ?? "",
    bankingAccountType: map.get("banking_account_type") ?? "",
    bankingSwiftBic: map.get("banking_swift_bic") ?? "",
    bankTransferEnabled: map.get("payment_bank_transfer_enabled") === "true",
    bankTransferTitle: map.get("payment_bank_transfer_title") ?? "Bank Transfer",
    bankTransferInstructions: map.get("payment_bank_transfer_instructions") ?? "Pay via bank transfer using the details provided.",
    mobileWalletsEnabled: map.get("payment_mobile_wallets_enabled") === "true",
    mobileWalletTitle: map.get("payment_mobile_wallets_title") ?? "Mobile Wallets",
    mobileWalletDescription: map.get("payment_mobile_wallet_description") ?? "",
    supportedWallets: map.get("payment_supported_wallets") ?? "",
    acceptedPaymentTypes: map.get("accepted_payment_types") ?? "Visa,Mastercard,eWallet",
    managerRoleLabel: map.get("document_manager_role_label") ?? "Managing Director",
    signatureImage: map.get("document_signature_image") ?? "",
    signatoryName: map.get("document_signatory_name") ?? "Thomas Kamushambe",
    signatoryRole: map.get("document_signatory_role") ?? "Managing Director",
    footerText: map.get("document_footer_text") ?? "",
    paymentVisible: map.get("document_payment_visible") !== "false",
    bankingVisible: map.get("document_banking_visible") !== "false",
    signatureVisible: map.get("document_signature_visible") !== "false",
    secureFooterVisible: map.get("document_secure_footer_visible") !== "false",
    secureFooterMessage: map.get("document_secure_footer_message") ?? "Secure payments. All transactions are safe and encrypted.",
    currency: map.get("currency") ?? "N$",
    location: map.get("location") ?? "Mukwe, Namibia",
    phone: map.get("phone") ?? "",
    whatsapp: map.get("whatsapp") ?? "",
  };
}

export type DocumentSettings = Awaited<ReturnType<typeof getDocumentSettings>>;

export async function getPublicShareCode(documentId: string) {
  const [link] = await getDb()
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.documentId, documentId), sql`${shareLinks.revokedAt} is null`))
    .orderBy(desc(shareLinks.createdAt))
    .limit(1);
  return link ?? null;
}

export async function generateShareCode(documentId: string, documentNumber: string) {
  const random = crypto.randomUUID().slice(0, 4).toUpperCase();
  const publicCode = `${documentNumber}-${random}`;
  const id = crypto.randomUUID();
  await getDb().insert(shareLinks).values({ id, documentId, publicCode });
  const [link] = await getDb()
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.id, id))
    .limit(1);
  return link!;
}

export async function resolveShareCode(code: string) {
  const [link] = await getDb()
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.publicCode, code), sql`${shareLinks.revokedAt} is null`))
    .limit(1);
  return link ?? null;
}
