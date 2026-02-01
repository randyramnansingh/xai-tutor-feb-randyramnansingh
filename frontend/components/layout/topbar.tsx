"use client";
import { Search, Bell, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/60 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Orders</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-input px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search anything"
            className="w-64 bg-transparent text-sm outline-none"
          />
        </div>
        <button className="relative rounded-md p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0 -top-0 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground grid place-items-center">2</span>
        </button>
        <button className="hidden sm:flex items-center gap-1 rounded-md bg-foreground px-3 py-2 text-background">
          <Plus className="h-4 w-4" />
          Add Orders
        </button>
        <div className="flex -space-x-2 overflow-hidden">
          {["K", "A", "R"].map((name, i) => (
            <Avatar key={i} name={name} className="h-6 w-6" />
          ))}
        </div>
      </div>
    </header>
  );
}
