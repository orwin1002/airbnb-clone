"use client";

import { formatMessageTimestamp } from "@/lib/dates";

interface Props {
  reply: string;
  replyAt?: string | null;
  className?: string;
}

export default function HostReply({ reply, replyAt, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Host response</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{reply}</p>
      {replyAt && (
        <p className="mt-2 text-xs text-muted-foreground">{formatMessageTimestamp(replyAt)}</p>
      )}
    </div>
  );
}
