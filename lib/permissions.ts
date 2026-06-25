import { type Role } from "./auth";

// ── Permission keys ──────────────────────────────────────────────────
export const PERMISSIONS = {
  // Bookings
  bookings_create: "bookings:create",
  bookings_view: "bookings:view",
  bookings_edit: "bookings:edit",
  bookings_delete: "bookings:delete",
  bookings_manage_status: "bookings:manage_status",
  bookings_check_in_out: "bookings:check_in_out",

  // Rooms
  rooms_view: "rooms:view",
  rooms_manage: "rooms:manage",
  rooms_manage_availability: "rooms:manage_availability",

  // Customers
  customers_view: "customers:view",
  customers_edit: "customers:edit",
  customers_merge: "customers:merge",

  // Payments
  payments_view: "payments:view",
  payments_record: "payments:record",
  payments_refund: "payments:refund",

  // Documents
  documents_view: "documents:view",
  documents_create: "documents:create",
  documents_edit: "documents:edit",
  documents_delete: "documents:delete",
  documents_send: "documents:send",
  documents_share: "documents:share",

  // Follow-ups
  follow_ups_view: "follow_ups:view",
  follow_ups_manage: "follow_ups:manage",

  // Users
  users_view: "users:view",
  users_create: "users:create",
  users_create_staff: "users:create_staff",
  users_create_admin: "users:create_admin",
  users_create_owner: "users:create_owner",
  users_edit: "users:edit",
  users_delete: "users:delete",
  users_manage_role: "users:manage_role",
  users_manage_status: "users:manage_status",

  // Permissions
  permissions_manage: "permissions:manage",

  // Settings
  settings_view: "settings:view",
  settings_manage: "settings:manage",

  // Finance
  finance_view_reports: "finance:view_reports",
  finance_manage_banking_details: "finance:manage_banking_details",

  // Security
  security_view_audit_log: "security:view_audit_log",
  security_manage_authentication: "security:manage_authentication",

  // Testimonials
  testimonials_manage: "testimonials:manage",

  // FAQs
  faqs_manage: "faqs:manage",

  // Dashboard
  dashboard_view: "dashboard:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Role defaults ────────────────────────────────────────────────────
const ALL = Object.values(PERMISSIONS);

const OWNER_ONLY: Permission[] = [
  PERMISSIONS.users_create_owner,
  PERMISSIONS.users_delete,
  PERMISSIONS.permissions_manage,
  PERMISSIONS.finance_manage_banking_details,
  PERMISSIONS.security_manage_authentication,
  PERMISSIONS.users_create_admin,
];

const ADMIN_DENIED: Permission[] = [
  ...OWNER_ONLY,
  PERMISSIONS.users_create_owner,
  PERMISSIONS.users_delete,
  PERMISSIONS.users_manage_role,
  PERMISSIONS.users_manage_status,
  PERMISSIONS.permissions_manage,
  PERMISSIONS.finance_manage_banking_details,
  PERMISSIONS.security_manage_authentication,
];

const STAFF_ONLY: Permission[] = [
  PERMISSIONS.bookings_create,
  PERMISSIONS.bookings_view,
  PERMISSIONS.bookings_edit,
  PERMISSIONS.bookings_check_in_out,
  PERMISSIONS.customers_view,
  PERMISSIONS.customers_edit,
  PERMISSIONS.follow_ups_view,
  PERMISSIONS.follow_ups_manage,
  PERMISSIONS.rooms_view,
  PERMISSIONS.dashboard_view,
];

const roleDefaults: Record<Role, Permission[]> = {
  owner: [...ALL],
  admin: ALL.filter((perm) => !ADMIN_DENIED.includes(perm)),
  staff: [...STAFF_ONLY],
};

export function getRoleDefaults(role: Role): Permission[] {
  return [...roleDefaults[role]];
}

export function isOwnerOnly(permission: Permission): boolean {
  return OWNER_ONLY.includes(permission);
}

export function getEffectivePermissions(
  role: Role,
  grants: string[] = [],
  restrictions: string[] = []
): Permission[] {
  const defaults = getRoleDefaults(role);
  const effective = new Set<Permission>([...defaults, ...(grants as Permission[])]);
  for (const restriction of restrictions) {
    effective.delete(restriction as Permission);
  }
  return [...effective];
}

export function hasPermission(
  role: Role,
  permission: Permission,
  grants: string[] = [],
  restrictions: string[] = []
): boolean {
  return getEffectivePermissions(role, grants, restrictions).includes(permission);
}

export function canManageUser(
  actorRole: string,
  actorId: string,
  targetRole: string,
  targetId: string
): boolean {
  if (actorRole === "owner") return true;
  if (actorRole === "admin" && targetRole === "staff") return true;
  if (actorRole === "admin" && targetRole === "admin" && actorId === targetId) return true;
  return false;
}
