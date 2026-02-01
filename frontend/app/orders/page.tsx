"use client";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Printer, Trash2, Pencil, MoreHorizontal, ChevronUp, ChevronDown, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

// Types and helper to map API -> UI
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string; // ISO
  status: "Pending" | "Completed" | "Refunded";
  total: number; // dollars
  paymentStatus: "Paid" | "Unpaid";
};

function apiToUiOrder(o: any): Order {
  const statusRaw = String(o.status ?? "pending").toLowerCase();
  const paymentRaw = String(o.payment_status ?? "paid").toLowerCase();
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    id: String(o.id),
    orderNumber: String(o.order_number ?? o.orderNumber ?? ""),
    customerName: o.customer?.name ?? o.customer_name ?? "Unknown",
    date: o.order_date ? new Date(o.order_date).toISOString() : new Date().toISOString(),
    status: cap(statusRaw) as Order["status"],
    total: Number(o.total_amount ?? o.total ?? 0),
    paymentStatus: cap(paymentRaw) as Order["paymentStatus"],
  };
}

export default function OrdersPage() {
  const [collapsed, setCollapsed] = useState(false);
  // UI state
  const [filter, setFilter] = useState<"all" | "incomplete" | "overdue" | "ongoing" | "finished">("all");
  const [sort, setSort] = useState<{ key: keyof Order | null; dir: "asc" | "desc" }>(
    { key: null, dir: "asc" }
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    order_date: "",
    status: "pending" as "pending" | "completed" | "refunded",
    payment_status: "unpaid" as "paid" | "unpaid",
    total_amount: 0,
  });
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
        setStats({
          total_orders_this_month: data.total_orders_this_month ?? 0,
          pending_orders: data.pending_orders ?? 0,
          shipped_orders: data.shipped_orders ?? 0,
          refunded_orders: data.refunded_orders ?? 0,
        });
      })
      .catch((err) => {
        console.error("Failed to load order stats", err);
      });
  }, []);

  // Fetch orders when filter/page/limit changes
  useEffect(() => {
    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
    fetch(`${base}/orders?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const apiOrders = (data.orders ?? []).map((o: any) => apiToUiOrder(o));
        setOrders(apiOrders);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Failed to load orders", err);
      });
    return () => controller.abort();
  }, [filter, page, limit]);

  // Sorting within the current page (server paginates)
  const sorted = useMemo(() => {
    const data = [...orders];
    if (sort.key) {
      const key = sort.key;
      const dir = sort.dir === "asc" ? 1 : -1;
      data.sort((a: any, b: any) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }
    return data;
  }, [orders, sort]);

  const visible = sorted; // server handles page/limit
  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o.id));
  const someVisibleSelected = visible.some((o) => selected.has(o.id)) && !allVisibleSelected;

  function toggleAllVisible(e: React.ChangeEvent<HTMLInputElement>) {
    const next = new Set(selected);
    if (e.target.checked) visible.forEach((o) => next.add(o.id));
    else visible.forEach((o) => next.delete(o.id));
    setSelected(next);
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function bulkDelete() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const body = { order_ids: Array.from(selected) };
    fetch(`${base}/orders/bulk`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => {
        setSelected(new Set());
        const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
        return fetch(`${base}/orders?${params.toString()}`).then((r) => r.json());
      })
      .then((data) => {
        setOrders((data.orders ?? []).map((o: any) => apiToUiOrder(o)));
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((e) => console.error("bulk delete failed", e));
  }

  function bulkDuplicate() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const body = { order_ids: Array.from(selected) };
    fetch(`${base}/orders/bulk/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => {
        setSelected(new Set());
        const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
        return fetch(`${base}/orders?${params.toString()}`).then((r) => r.json());
      })
      .then((data) => {
        setOrders((data.orders ?? []).map((o: any) => apiToUiOrder(o)));
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((e) => console.error("bulk duplicate failed", e));
  }

  function bulkStatus(next: Order["status"]) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const body = { order_ids: Array.from(selected), status: next.toLowerCase() } as any;
    fetch(`${base}/orders/bulk/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => {
        setSelected(new Set());
        setShowBulkMenu(false);
        const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
        return fetch(`${base}/orders?${params.toString()}`).then((r) => r.json());
      })
      .then((data) => {
        setOrders((data.orders ?? []).map((o: any) => apiToUiOrder(o)));
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((e) => console.error("bulk status failed", e));
  }

  function addOrder() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const body = {
      customer: { name: "New Customer", email: "new@example.com" },
      total_amount: 99,
      status: "pending",
      payment_status: "unpaid",
    };
    fetch(`${base}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => {
        setPage(1);
        const params = new URLSearchParams({ status: filter, page: "1", limit: String(limit) });
        return fetch(`${base}/orders?${params.toString()}`).then((r) => r.json());
      })
      .then((data) => {
        setOrders((data.orders ?? []).map((o: any) => apiToUiOrder(o)));
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((e) => console.error("add order failed", e));
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
            <p className="text-sm text-muted-foreground">
              {(() => {
                const start = (page - 1) * limit + 1;
                const end = Math.min(page * limit, total);
                return `Showing ${total === 0 ? 0 : start}-${end} of ${total} entries`;
              })()}
            </p>
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
                <Button onClick={() => setShowCreate(true)}>+ Add Order</Button>
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
            {showCreate && (
              <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg rounded-xl border border-border bg-background p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Create Order</h3>
                    <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowCreate(false)} aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {createError && (
                    <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                      {createError}
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCreateError(null);
                      setCreateLoading(true);
                      try {
                        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
                        const body = {
                          customer: { name: form.name, email: form.email, avatar: form.avatar || null },
                          total_amount: Number(form.total_amount),
                          status: form.status,
                          payment_status: form.payment_status,
                          order_date: form.order_date || null,
                        };
                        const res = await fetch(`${base}/orders`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });
                        if (!res.ok) {
                          const txt = await res.text();
                          throw new Error(txt || `Request failed (${res.status})`);
                        }
                        // Refresh first page after creation
                        setPage(1);
                        const params = new URLSearchParams({ status: filter, page: "1", limit: String(limit) });
                        const data = await fetch(`${base}/orders?${params.toString()}`).then((r) => r.json());
                        setOrders((data.orders ?? []).map((o: any) => apiToUiOrder(o)));
                        setTotal(data.total ?? 0);
                        setTotalPages(data.total_pages ?? 1);
                        setShowCreate(false);
                        setForm({ name: "", email: "", avatar: "", order_date: "", status: "pending", payment_status: "unpaid", total_amount: 0 });
                      } catch (err: any) {
                        setCreateError(err?.message || "Failed to create order");
                      } finally {
                        setCreateLoading(false);
                      }
                    }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Customer Name</span>
                      <input className="rounded-md border border-border bg-background px-2 py-1" required
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Customer Email</span>
                      <input type="email" className="rounded-md border border-border bg-background px-2 py-1" required
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-xs text-muted-foreground">Avatar URL (optional)</span>
                      <input className="rounded-md border border-border bg-background px-2 py-1"
                        value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Order Date</span>
                      <input type="date" className="rounded-md border border-border bg-background px-2 py-1"
                        value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Total Amount</span>
                      <input type="number" step="0.01" min="0" className="rounded-md border border-border bg-background px-2 py-1" required
                        value={form.total_amount}
                        onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <select className="rounded-md border border-border bg-background px-2 py-1"
                        value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Payment Status</span>
                      <select className="rounded-md border border-border bg-background px-2 py-1"
                        value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as any })}>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </label>
                    <div className="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                      <Button type="submit" disabled={createLoading}>{createLoading ? "Creating..." : "Create Order"}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1" />
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                {renderPageButtons(totalPages, page).map((p, i) =>
                  p === "..." ? (
                    <span key={`el-${i}`} className="px-2">…</span>
                  ) : (
                    <Button key={p as number} variant={p === page ? "default" : "outline"} onClick={() => setPage(p as number)}>
                      {p}
                    </Button>
                  )
                )}
                <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Simple helper to render pagination buttons list
function renderPageButtons(totalPages: number, current: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const last = Math.max(1, totalPages);
  if (last <= 5) {
    for (let i = 1; i <= last; i++) pages.push(i);
    return pages;
  }
  const addRange = (a: number, b: number) => {
    for (let i = a; i <= b; i++) pages.push(i);
  };
  pages.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) pages.push("...");
  addRange(start, end);
  if (end < last - 1) pages.push("...");
  pages.push(last);
  return pages;
}

// (Removed duplicate implementation)
