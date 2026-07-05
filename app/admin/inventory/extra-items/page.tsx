import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { requireRole } from "@/lib/auth-middleware";
import { ExtraItemsManager } from "./extra-items-manager";

export const metadata = {
  title: "Extra Services & Charges – Tanhwe Guest House",
};

export default async function ExtraItemsPage() {
  await requireRole(["owner", "admin"]);
  return (
    <div className="mx-auto max-w-4xl">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ExtraItemsManager />
      </Suspense>
    </div>
  );
}
