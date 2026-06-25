import { getFollowUpOptions, getFollowUps } from "@/lib/admin-data";
import { requireRole } from "@/lib/auth-middleware";
import { FollowUpList } from "@/components/admin/follow-up-list";

export default async function AdminFollowUps() {
  const session = await requireRole(["owner", "admin", "staff"]);
  const [items, options] = await Promise.all([
    getFollowUps(session.user.role === "staff" ? { assignedTo: session.user.id } : {}),
    session.user.role === "staff" ? Promise.resolve(null) : getFollowUpOptions(),
  ]);
  const now = new Date();
  return <FollowUpList initial={items} options={options} now={now} staffView={session.user.role === "staff"} />;
}
