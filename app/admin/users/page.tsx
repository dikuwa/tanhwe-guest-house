import { UserForm } from "@/components/admin/user-form";
import { UserRole } from "@/components/admin/user-role";
import { UserActions } from "@/components/admin/user-actions";
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
          Review staff access and update operational roles.
        </p>
      </header>

      {/* Create new user section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Add new user</h2>
        <UserForm />
      </section>

      {/* Users list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Current users</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-4 font-medium">
                    {user.name}
                    {user.id === session.user.id && (
                      <span className="ml-2 text-xs text-muted-foreground">You</span>
                    )}
                  </td>
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">
                    <UserRole
                      id={user.id}
                      role={user.role}
                      disabled={user.id === session.user.id}
                    />
                  </td>
                  <td className="px-4 py-4">{user.createdAt.toLocaleDateString("en-NA")}</td>
                  <td className="px-4 py-4">
                    {user.id !== session.user.id && <UserActions userId={user.id} userName={user.name} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
