export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").replace(/^00/, "");
}

export function normalizeEmail(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

export function customerIdentity(input: {
  phone: string;
  whatsapp: string;
  email?: string | null;
}) {
  return {
    phone: normalizePhone(input.phone),
    whatsapp: normalizePhone(input.whatsapp),
    email: normalizeEmail(input.email),
  };
}
