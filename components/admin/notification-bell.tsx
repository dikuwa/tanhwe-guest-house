"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  bookingId: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnread(data.unread);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (response.ok) {
        setUnread(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const unreadItems = notifications.filter((n) => !n.readAt);
  const displayNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex size-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-2 w-[360px] origin-top-right rounded-xl border bg-popover shadow-lg ring-1 ring-foreground/10"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">
              Notifications
              {unread > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({unread} unread)
                </span>
              )}
            </p>
            {unreadItems.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {markingAll ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCheck className="size-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto size-8 text-neutral-300" />
                <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {displayNotifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative px-4 py-3 text-sm transition-colors",
                        isUnread ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "line-clamp-1",
                              isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          {notification.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {notification.description}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground/60">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markRead(notification.id)}
                              className="flex size-5 items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground"
                              aria-label="Mark as read"
                            >
                              <span className="size-2 rounded-full bg-primary" />
                            </button>
                          )}
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                if (isUnread) markRead(notification.id);
                                setOpen(false);
                              }}
                              className="text-[10px] font-medium text-primary hover:text-primary/80"
                            >
                              View booking
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="border-t px-4 py-2.5 text-center">
              <Link
                href="/admin/notifications"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
