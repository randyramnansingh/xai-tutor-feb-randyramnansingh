"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Printer, Trash2 } from "lucide-react";

export default function OrdersPage() {
  const [collapsed, setCollapsed] = useState(false);
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
            {["Total Orders This Month", "Pending Orders", "Shipped Orders", "Refunded Orders"].map(
              (title, i) => (
                <Card key={title}>
                  <CardHeader>
                    <div className="text-xs text-muted-foreground">{title}</div>
                    <div className="mt-2 text-2xl font-semibold">{[200, 20, 180, 10][i]}</div>
                  </CardHeader>
                </Card>
              )
            )}
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
