"use client";

import { MailIcon, PhoneIcon, Trash2Icon } from "lucide-react";
import type { Enquiry } from "@glamsite/shared/types";
import { EmptyState, Panel } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAction } from "@/lib/use-action";
import { deleteEnquiry, setEnquiryRead } from "./actions";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function MessagesList({ enquiries }: { enquiries: Enquiry[] }) {
  const { pending, run } = useAction();

  if (!enquiries.length) {
    return (
      <Panel>
        <EmptyState title="No messages yet">Messages from the contact form on your site will appear here.</EmptyState>
      </Panel>
    );
  }

  return (
    <div className="grid gap-3">
      {enquiries.map((item) => (
        <Panel key={item.id} className={item.isRead ? "opacity-75" : ""}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium">
                {item.name}
                {!item.isRead ? <Badge className="bg-brand text-white">New</Badge> : null}
              </p>
              <p className="text-xs text-muted-foreground">{when(item.createdAt)}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={pending}
                onClick={() => run(() => setEnquiryRead(item.id, !item.isRead))}>
                {item.isRead ? "Mark unread" : "Mark read"}
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Delete message" disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this message?")) run(() => deleteEnquiry(item.id), "Message deleted");
                }}>
                <Trash2Icon />
              </Button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm">{item.message}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {item.email ? (
              <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1.5 text-brand">
                <MailIcon className="size-4" /> {item.email}
              </a>
            ) : null}
            {item.phone ? (
              <a href={`tel:${item.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-brand">
                <PhoneIcon className="size-4" /> {item.phone}
              </a>
            ) : null}
          </div>
        </Panel>
      ))}
    </div>
  );
}
