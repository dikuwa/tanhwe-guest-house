"use client";

import { useState } from "react";
import { BellRing, MessageCircle, Phone } from "lucide-react";
import { FollowUpComplete } from "@/components/admin/follow-up-complete";
import { FollowUpForm } from "@/components/admin/follow-up-form";
import { Badge } from "@/components/ui/badge";

type FollowUp = {
  id: string; title: string; status: string; priority: string;
  dueDate: Date; customerName?: string | null; assigneeName?: string | null;
  customerPhone?: string | null; customerWhatsapp?: string | null;
  notes?: string | null;
};

type Options = {
  customerOptions: { id: string; label: string }[];
  bookingOptions: { id: string; label: string; customerId: string; customerName?: string; checkIn?: Date }[];
  staffOptions: { id: string; label: string }[];
};

export function FollowUpList({ initial, options, now: initialNow, staffView }: { initial: FollowUp[]; options: Options | null; now: Date; staffView?: boolean }) {
  const [items, setItems] = useState<FollowUp[]>(initial);
  const now = new Date(initialNow);

  function handleCreated(item: FollowUp) {
    setItems((prev) => [...prev, item]);
  }

  function handleCompleted(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Follow-ups</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep deposit, arrival, quote, and balance conversations moving.
        </p>
      </header>
      {options && !staffView && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">New follow-up</h2>
          <FollowUpForm options={options} onCreated={handleCreated} />
        </section>
      )}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Task list</h2>
        <div className="space-y-3">
          {items.map((item) => {
            const overdue = item.status !== "completed" && new Date(item.dueDate) < now;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant={overdue ? "destructive" : "outline"}>
                      {overdue ? "Overdue" : item.status}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {new Date(item.dueDate).toLocaleDateString("en-NA")}
                    {item.customerName ? ` · ${item.customerName}` : ""}
                    {item.assigneeName ? ` · ${item.assigneeName}` : " · Unassigned"}
                  </p>
                  {item.notes && <p className="mt-2 text-sm">{item.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.customerPhone && (
                    <a
                      aria-label="Call customer"
                      className="inline-flex size-9 items-center justify-center rounded-lg border"
                      href={`tel:${item.customerPhone.replace(/[^+\d]/g, "")}`}
                    >
                      <Phone className="size-4" />
                    </a>
                  )}
                  {item.customerWhatsapp && (
                    <a
                      aria-label="WhatsApp customer"
                      className="inline-flex size-9 items-center justify-center rounded-lg border"
                      href={`https://wa.me/${item.customerWhatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                  {item.status !== "completed" && <FollowUpComplete id={item.id} onCompleted={handleCompleted} />}
                </div>
              </article>
            );
          })}
          {!items.length && (
            <div className="grid place-items-center rounded-xl border border-dashed p-14 text-center">
              <BellRing className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No follow-ups need attention</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New tasks and scheduled reminders will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
