import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { activityLogs, settings } from "@/lib/db/schema";

const allowed = [
  "phone",
  "whatsapp",
  "location",
  "check_in_time",
  "check_out_time",
  "currency",
  "email",
  "time_format",
  "flextech_url",
  "location_pin_url",
  "conference_title",
  "conference_description",
  "conference_capacity",
  "conference_amenities",
  "conference_suitable_for",
  "conference_operating_hours",
  "conference_pricing_note",
  "whatsapp_conference_message",
  "whatsapp_location_message",
  "business_name",
  "trading_name",
  "physical_address",
  "town",
  "region",
  "country",
  "business_email",
  "primary_phone",
  "whatsapp_number",
  "website_url",
  "logo_url",
  "banking_account_name",
  "banking_account_number",
  "banking_bank_name",
  "banking_branch_name",
  "banking_branch_code",
  "banking_account_type",
  "banking_swift_bic",
  "payment_bank_transfer_enabled",
  "payment_mobile_wallets_enabled",
  "payment_mobile_wallet_description",
  "payment_supported_wallets",
  "document_manager_role_label",
  "document_signature_image",
  "document_footer_text",
  "document_payment_visible",
  "document_banking_visible",
  "document_signature_visible",
  "document_signatory_name",
  "document_signatory_role",
  "document_secure_footer_visible",
  "document_secure_footer_message",
  "payment_bank_transfer_title",
  "payment_bank_transfer_instructions",
  "payment_mobile_wallets_title",
  "accepted_payment_types",
] as const;
const input = z.object({ key: z.enum(allowed), value: z.string().trim().min(1).max(1000) });
export async function PATCH(request: NextRequest) {
  const session = await authorizeRequest(request.headers, ["owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  await getDb().transaction(async (tx) => {
    await tx
      .update(settings)
      .set({ value: parsed.data.value, updatedBy: session.user.id, updatedAt: new Date() })
      .where(eq(settings.key, parsed.data.key));
    await tx
      .insert(activityLogs)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: "updated",
        entity: "setting",
        entityId: parsed.data.key,
      });
  });
  return NextResponse.json({ success: true });
}
