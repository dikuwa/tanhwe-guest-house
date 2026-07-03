export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^00/, "");
}

export function normalizeNamibianPhone(value: string): string | null {
  const digits = phoneDigits(value);
  if (/^0(6|8)\d{8}$/.test(digits)) return `264${digits.slice(1)}`;
  if (/^264(6|8)\d{8}$/.test(digits)) return digits;
  if (/^(6|8)\d{8}$/.test(digits)) return `264${digits}`;
  if (/^[1-9]\d{6,14}$/.test(digits)) return digits;
  return null;
}

export function validatePhoneNumber(value: string): string | undefined {
  if (!value.trim()) return "Phone number is required";
  return normalizeNamibianPhone(value) ? undefined : "Please enter a valid phone number";
}

export function whatsappHref(phone: string, message?: string): string {
  const normalized = normalizeNamibianPhone(phone) ?? phoneDigits(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
}
