"use client";

import React, { useEffect, useState } from "react";

interface Notice {
  id: string;
  title: string;
  body: string;
  read: boolean;
  kind: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);

  async function load() {
    const response = await fetch("/api/notifications");
    const payload = await response.json();
    setItems(payload.items ?? []);
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, []);

  async function mark(id?: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Notifications</h1>
        <button type="button" onClick={() => mark()} className="text-xs font-bold text-brand-cyan">Mark all read</button>
      </div>
      <p className="text-sm text-slate-400">In-app only. No email or SMS is sent.</p>
      {items.length === 0 && <p className="text-sm text-slate-400">No high-risk heuristic signals in the latest weather pull.</p>}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-brand-border p-4">
            <div className="flex justify-between gap-3">
              <h2 className="text-sm font-bold text-white">{item.title}</h2>
              <span className="text-xs text-slate-400">{item.read ? "Read" : "Unread"}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{item.body}</p>
            {!item.read && <button type="button" className="text-xs text-brand-cyan mt-2" onClick={() => mark(item.id)}>Mark read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
