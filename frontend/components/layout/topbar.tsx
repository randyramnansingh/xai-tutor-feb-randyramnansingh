"use client";
import { Search, Bell, PanelLeftOpen } from "lucide-react";
import { AvatarGroup } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/60 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          className="rounded-md p-2 hover:bg-accent"
          onClick={onToggleSidebar}
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <h2 className="ml-2 text-sm font-semibold">Orders</h2>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup
          people={[
            { name: "Kim", src: "https://api.dicebear.com/7.x/initials/svg?seed=Kim" },
            { name: "Alex", src: "https://api.dicebear.com/7.x/initials/svg?seed=Alex" },
            { name: "Randy", src: "https://api.dicebear.com/7.x/initials/svg?seed=Randy" },
            { name: "Sam", src: "https://api.dicebear.com/7.x/initials/svg?seed=Sam" },
            { name: "Taylor", src: "https://api.dicebear.com/7.x/initials/svg?seed=Taylor" },
          ]}
          max={2}
        />
        <button className="relative rounded-md p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0 -top-0 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[10px] text-destructive-foreground">2</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-input px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            placeholder="Search anything"
            className="w-64 bg-transparent text-sm outline-none"
          />
          <span className="rounded-md bg-muted px-2 text-xs text-muted-foreground">⌘K</span>
        </div>
        <div className="relative">
          <button
            className="grid h-8 w-8 place-items-center rounded-full border border-border"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup
          >
            <span className="text-sm">R</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-10 w-40 rounded-md border border-border bg-background p-2 text-sm shadow-md">
              <button className="block w-full rounded-md px-2 py-1 text-left hover:bg-accent">Profile</button>
              <button className="block w-full rounded-md px-2 py-1 text-left hover:bg-accent">Settings</button>
              <button className="block w-full rounded-md px-2 py-1 text-left hover:bg-accent">Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
