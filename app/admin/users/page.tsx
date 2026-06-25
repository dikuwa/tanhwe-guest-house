import { UsersTable } from "./users-table";
import { getUsers } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";

export default async function AdminUsers() {
  const session = await requireRole(["owner"]);
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage user accounts, roles, and permissions.
        </p>
      </header>
      <UsersTable users={users} currentUserId={session.user.id} />
    </div>
  );
}
