import { CreateCustomerForm } from "./create-customer-form";
import { requireRole } from "@/lib/auth-middleware";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CreateCustomerPage() {
  await requireRole(["owner", "admin"]);
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/admin/customers" />}>
        <ArrowLeft /> Customers
      </Button>
      <header>
        <h1 className="font-heading text-2xl font-bold text-neutral-800">Add Customer</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Create a customer record before they make a booking. Existing phone numbers and emails will be checked for duplicates.
        </p>
      </header>
      <CreateCustomerForm />
    </div>
  );
}
