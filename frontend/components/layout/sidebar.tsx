"use client";
import { Home, Package, ShoppingCart, BarChart2, Users, Settings, HelpCircle, Moon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navMain = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: BarChart2 },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart2 },
];

const navSettings = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help Center", href: "/help", icon: HelpCircle },
];

export function Sidebar({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-background/60 backdrop-blur",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-8 w-8 rounded bg-orange-500" />
        {!collapsed && <span className="text-lg font-semibold">Prodex</span>}
      </div>

      <div className="px-3">
        {!collapsed && (
          <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Main</div>
        )}
        <nav className="space-y-1">
          {navMain.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                item.href === "/orders" && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-6 mb-2 px-2 text-xs font-medium text-muted-foreground">Settings</div>
        )}
        <nav className="space-y-1">
          {navSettings.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <>
            <div className="mt-6 rounded-md bg-muted p-3">
              <div className="mb-2 text-xs text-muted-foreground">Dark Mode</div>
              <button className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span>Toggle</span>
                <Moon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-md border border-border p-3">
              <div className="mb-2 text-xs text-muted-foreground">Upgrade to Premium</div>
              <button className="w-full rounded-md bg-foreground px-3 py-2 text-background">Upgrade Now</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
