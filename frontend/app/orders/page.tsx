"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Printer, Trash2 } from "lucide-react";

export default function OrdersPage() {
  const [collapsed, setCollapsed] = useState(false);
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

          <div className="mt-6 rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <button className="rounded-full bg-accent px-3 py-1">All</button>
                <button className="rounded-full px-3 py-1 hover:bg-accent">Incomplete</button>
                <button className="rounded-full px-3 py-1 hover:bg-accent">Overdue</button>
                <button className="rounded-full px-3 py-1 hover:bg-accent">Ongoing</button>
                <button className="rounded-full px-3 py-1 hover:bg-accent">Finished</button>
              </div>
              <div className="flex gap-2 text-sm">
                <Button variant="outline">Bulk Update Status</Button>
                <Button variant="outline">Export Orders</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH className="w-8">#</TH>
                    <TH>Order Number</TH>
                    <TH>Customer Name</TH>
                    <TH>Order Date</TH>
                    <TH>Status</TH>
                    <TH>Total Amount</TH>
                    <TH>Payment Status</TH>
                    <TH>Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const states = [
                      { label: "Pending", variant: "warning" as const },
                      { label: "Completed", variant: "success" as const },
                      { label: "Refunded", variant: "destructive" as const },
                    ];
                    const state = states[idx % states.length];
                    return (
                      <TR key={idx}>
                        <TD>
                          <input type="checkbox" />
                        </TD>
                        <TD>#ORDID{String(100 + idx).padStart(2, "0")}</TD>
                        <TD>Clint Hoppe</TD>
                        <TD>16 Dec 2024</TD>
                        <TD>
                          <Badge variant={state.variant}>{state.label}</Badge>
                        </TD>
                        <TD>$60.55</TD>
                        <TD>{state.label === "Pending" ? "Unpaid" : "Paid"}</TD>
                        <TD>⋮</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2"><Copy className="h-4 w-4" /> Duplicate</Button>
                <Button variant="outline" className="gap-2"><Printer className="h-4 w-4" /> Print</Button>
                <Button variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline">Previous</Button>
                {[1, 2, 3].map((p) => (
                  <Button key={p} variant={p === 1 ? "default" : "outline"}>{p}</Button>
                ))}
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
