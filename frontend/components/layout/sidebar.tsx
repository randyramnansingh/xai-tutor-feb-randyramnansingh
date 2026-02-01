"use client";
import {
  Home,
  Package,
  ShoppingCart,
  BarChart2,
  Users,
  Settings as SettingsIcon,
  HelpCircle,
  Moon,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Plug,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navMain = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: BarChart2 },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart2 },
];

const navSettings = [
  { label: "Marketplace Sync", href: "/settings/marketplace", icon: Plug },
  { label: "Payment Gateways", href: "/settings/payments", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
  { label: "Help Center", href: "/help", icon: HelpCircle },
];

export function Sidebar({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = stored ? stored === "dark" : prefersDark;
    setIsDark(initialDark);
    if (initialDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleDark = () => {
    setIsDark((v) => {
      const next = !v;
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-background/60 backdrop-blur",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-orange-500" />
          {!collapsed && <span className="text-lg font-semibold">Prodex</span>}
        </div>
        {!collapsed && (
          <div className="mt-3">
            <button
              className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
              onClick={() => setWorkspaceOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-black/80 dark:bg-white/80" />
                <span>Uxerflow</span>
              </div>
              {workspaceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {workspaceOpen && (
              <div className="mt-2 space-y-1 rounded-md border border-border bg-background p-2 text-sm">
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Uxerflow
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">Acme Inc</button>
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">New workspace…</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 pb-4">
        {!collapsed && (
          <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Main</div>
        )}
        <nav className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            {!collapsed && "Dashboard"}
          </Link>
          {/* Products expandable */}
          <button
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => setProductsOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {!collapsed && "Products"}
            </span>
            {!collapsed && (productsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </button>
          {!collapsed && productsOpen && (
            <div className="ml-7 space-y-1">
              <Link href="/products" className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent">All Products</Link>
              <Link href="/products/new" className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent">Add Product</Link>
            </div>
          )}
          {/* Orders expanded */}
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
              "bg-accent text-accent-foreground"
            )}
            onClick={() => setOrdersOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {!collapsed && "Orders"}
            </span>
            {!collapsed && (ordersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </button>
          {!collapsed && ordersOpen && (
            <div className="ml-7 space-y-1">
              <Link href="/orders" className="block rounded-md bg-accent px-3 py-1.5 text-sm">All Orders</Link>
              <Link href="/orders/returns" className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent">Returns</Link>
              <Link href="/orders/tracking" className="block rounded-md px-3 py-1.5 text-sm hover:bg-accent">Order Tracking</Link>
            </div>
          )}
          {/* Rest */}
          <Link
            href="/sales"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            {!collapsed && "Sales"}
          </Link>
          <Link
            href="/customers"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Users className="h-4 w-4" />
            {!collapsed && "Customers"}
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart2 className="h-4 w-4" />
            {!collapsed && "Reports"}
          </Link>
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
              <button
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                onClick={toggleDark}
              >
                <span>{isDark ? "On" : "Off"}</span>
                <Moon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-md border border-border p-3">
              <div className="mb-2 text-xs text-muted-foreground">Upgrade to Premium</div>
              <p className="mb-2 text-xs text-muted-foreground">Your Premium Account will expire in 18 days.</p>
              <button className="w-full rounded-md bg-foreground px-3 py-2 text-background">Upgrade Now</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
