"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Printer, Trash2, Pencil, MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export default function OrdersPage() {
  const [collapsed, setCollapsed] = useState(false);
  // UI state
  const [filter, setFilter] = useState<"all" | "incomplete" | "overdue" | "ongoing" | "finished">("all");
  const [sort, setSort] = useState<{ key: keyof Order | null; dir: "asc" | "desc" }>(
    { key: null, dir: "asc" }
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>(() => seedOrders());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [stats, setStats] = useState({
    total_orders_this_month: 0,
    pending_orders: 0,
    shipped_orders: 0,
    refunded_orders: 0,
  });

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    fetch(`${base}/orders/stats`)
      .then((r) => r.json())
      .then((data) => {
        setStats((prev) => ({
          ...prev,
          total_orders_this_month: data.total_orders_this_month ?? 0,
          pending_orders: data.pending_orders ?? 0,
          shipped_orders: data.shipped_orders ?? 0,
          refunded_orders: data.refunded_orders ?? 0,
        }));
      })
      .catch((err) => {
        console.error("Failed to load order stats", err);
      });
  }, []);

  type Order = {
    id: string;
    orderNumber: string;
    customerName: string;
    date: string; // ISO
    status: "Pending" | "Completed" | "Refunded";
    total: number; // cents or dollars
    paymentStatus: "Paid" | "Unpaid";
  };

  function seedOrders(): Order[] {
    const names = [
      "Esther Kehn",
      "Denise Kuhn",
      "Clint Hoppe",
      "Darin Deckow",
      "Joaquelyn Robel",
      "Erin Bins",
      "Gretchen Quitz",
      "Stewart Kules",
    ];
    const statuses: Order["status"][] = ["Pending", "Completed", "Refunded"];
    const pays: Order["paymentStatus"][] = ["Paid", "Unpaid"];
    const base = new Date("2024-12-16").getTime();
    return Array.from({ length: 12 }).map((_, i) => {
      const name = names[i % names.length];
      const status = statuses[i % statuses.length];
      const paymentStatus = status === "Pending" ? (i % 2 ? "Paid" : "Unpaid") : "Paid";
      const date = new Date(base - i * 24 * 3600 * 1000).toISOString();
      return {
        id: `ord-${i + 1}`,
        orderNumber: `#ORDID${String(100 + i).padStart(2, "0")}`,
        customerName: name,
        date,
        status,
        total: Math.round(50 + Math.random() * 70),
        paymentStatus,
      };
    });
  }

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "incomplete") return o.paymentStatus === "Unpaid";
    if (filter === "ongoing") return o.status === "Pending";
    if (filter === "finished") return o.status === "Completed";
    if (filter === "overdue") {
      const daysOld = (Date.now() - new Date(o.date).getTime()) / (1000 * 3600 * 24);
      return o.status === "Pending" && daysOld > 7;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sort.key) return 0;
    const dir = sort.dir === "asc" ? 1 : -1;
    const va = a[sort.key];
    const vb = b[sort.key];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });

  const visible = sorted.slice(0, 9);

  const allVisibleSelected = visible.every((o) => selected.has(o.id));
  const someVisibleSelected = visible.some((o) => selected.has(o.id));

  function toggleAllVisible() {
    const next = new Set(selected);
    if (allVisibleSelected) visible.forEach((o) => next.delete(o.id));
    else visible.forEach((o) => next.add(o.id));
    setSelected(next);
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function bulkDelete() {
    setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
    setSelected(new Set());
  }

  function bulkDuplicate() {
    setOrders((prev) => {
      const dups: Order[] = prev
        .filter((o) => selected.has(o.id))
        .map((o, i) => ({ ...o, id: `${o.id}-d${i}`, orderNumber: `${o.orderNumber}-D` }));
      return [...dups, ...prev];
    });
  }

  function bulkStatus(next: Order["status"]) {
    setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status: next, paymentStatus: next === "Pending" ? o.paymentStatus : "Paid" } : o)));
    setSelected(new Set());
    setShowBulkMenu(false);
  }

  function addOrder() {
    setOrders((prev) => [
      {
        id: `ord-${Date.now()}`,
        orderNumber: `#ORDID${100 + prev.length}`,
        customerName: "New Customer",
        date: new Date().toISOString(),
        status: "Pending",
        total: 99,
        paymentStatus: "Unpaid",
      },
      ...prev,
    ]);
  }

  function SortableHeader({ label, k }: { label: string; k: keyof Order }) {
    const active = sort.key === k;
    const dir = active ? sort.dir : undefined;
    return (
      <button
        className="flex items-center gap-1 text-left"
        onClick={() =>
          setSort((s) => ({ key: k, dir: s.key === k && s.dir === "asc" ? "desc" : "asc" }))
        }
      >
        <span>{label}</span>
        {active ? (
          dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3 opacity-20" />
        )}
      </button>
    );
  }
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar collapsed={collapsed} />
      <div className="flex w-full flex-col">
        <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="mx-auto w-full max-w-6xl px-6 py-6">
          <section className="mb-6">
            <h1 className="text-xl font-semibold">All Orders</h1>
            <p className="text-sm text-muted-foreground">Showing 1-9 of 240 entries</p>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Total Orders This Month", color: "bg-blue-500" },
              { title: "Pending Orders", color: "bg-yellow-500" },
              { title: "Shipped Orders", color: "bg-green-500" },
              { title: "Refunded Orders", color: "bg-red-500" },
            ].map(({ title, color }, i) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                    {title}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    {
                      [
                        stats.total_orders_this_month,
                        stats.pending_orders,
                        stats.shipped_orders,
                        stats.refunded_orders,
                      ][i]
                    }
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-4 shadow-sm relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-2 text-sm">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "incomplete", label: "Incomplete" },
                    { key: "overdue", label: "Overdue" },
                    { key: "ongoing", label: "Ongoing" },
                    { key: "finished", label: "Finished" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={
                      filter === t.key
                        ? "rounded-full bg-accent px-3 py-1"
                        : "rounded-full px-3 py-1 hover:bg-accent"
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="relative">
                  <Button variant="outline" onClick={() => setShowBulkMenu((v) => !v)}>Bulk Update Status</Button>
                  {showBulkMenu && (
                    <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-border bg-background p-1 text-sm shadow-md">
                      {(["Pending", "Completed", "Refunded"] as const).map((s) => (
                        <button
                          key={s}
                          className="block w-full rounded-md px-2 py-1 text-left hover:bg-accent"
                          onClick={() => bulkStatus(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => console.log("export", visible)}>Export Orders</Button>
                <Button onClick={addOrder}>+ Add Orders</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH className="w-8">
                      <input
                        type="checkbox"
                        aria-checked={allVisibleSelected && someVisibleSelected ? "mixed" : allVisibleSelected}
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </TH>
                    <TH><SortableHeader label="Order Number" k="orderNumber" /></TH>
                    <TH><SortableHeader label="Customer Name" k="customerName" /></TH>
                    <TH><SortableHeader label="Order Date" k="date" /></TH>
                    <TH>Status</TH>
                    <TH><SortableHeader label="Total Amount" k="total" /></TH>
                    <TH><SortableHeader label="Payment Status" k="paymentStatus" /></TH>
                    <TH>Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((o) => {
                    const variant = o.status === "Completed" ? "success" : o.status === "Refunded" ? "destructive" : "warning";
                    const date = new Date(o.date);
                    return (
                      <TR key={o.id}>
                        <TD>
                          <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} />
                        </TD>
                        <TD>{o.orderNumber}</TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(o.customerName)}`}
                              alt={o.customerName}
                              className="h-5 w-5 rounded-full border border-border"
                            />
                            {o.customerName}
                          </div>
                        </TD>
                        <TD>{date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</TD>
                        <TD>
                          <Badge variant={variant as any}>{o.status}</Badge>
                        </TD>
                        <TD>${o.total.toFixed(2)}</TD>
                        <TD>{o.paymentStatus}</TD>
                        <TD>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <button className="hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                            <button className="hover:text-foreground" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                            <button className="hover:text-foreground" aria-label="More"><MoreHorizontal className="h-4 w-4" /></button>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
            {selected.size > 0 && (
              <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-2 py-1 shadow-md backdrop-blur">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{selected.size} Selected</span>
                  <Button variant="outline" className="gap-1" onClick={bulkDuplicate}><Copy className="h-4 w-4" /> Duplicate</Button>
                  <Button variant="outline" className="gap-1" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
                  <Button variant="destructive" className="gap-1" onClick={bulkDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
                  <Button variant="ghost" onClick={() => setSelected(new Set())}>×</Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
