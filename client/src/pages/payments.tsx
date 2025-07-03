import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function getStatus(payment: any) {
  if (Number(payment.total_paid) === 0 && Number(payment.total_due) > 0) return "Unpaid";
  if (Number(payment.total_paid) >= Number(payment.total_due)) return "Paid";
  if (Number(payment.total_paid) > 0 && Number(payment.total_paid) < Number(payment.total_due)) return "Partial";
  return "Unpaid";
}

function isDelayed(payment: any) {
  if (!payment.order || ["Completed", "Cancelled"].includes(payment.order.status)) return false;
  if (Number(payment.total_due) - Number(payment.total_paid) <= 0) return false;
  const created = new Date(payment.created_at);
  const now = new Date();
  const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return days > 7;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [addPayment, setAddPayment] = useState<{ [id: string]: { amount: string; notes: string; loading: boolean; error: string } }>({});

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_payments')
          .select('*, vendor:vendor_id(*), order:order_id(*)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPayments(data || []);
        setFiltered(data || []);
      } catch (e) {
        setPayments([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Get all unique order statuses for filter dropdown
  const allOrderStatuses = Array.from(new Set(payments.map(p => p.order?.status).filter(Boolean)));

  useEffect(() => {
    let result = payments;
    if (search) {
      result = result.filter(p =>
        (p.order?.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.vendor?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.vendor?.business_name || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(p => {
        const status = getStatus(p);
        if (statusFilter === "delayed") return isDelayed(p);
        return status.toLowerCase() === statusFilter;
      });
    }
    if (orderStatusFilter !== "all") {
      result = result.filter(p => p.order?.status === orderStatusFilter);
    }
    setFiltered(result);
  }, [search, payments, statusFilter, orderStatusFilter]);

  // Summary totals
  const totalDue = filtered.reduce((sum, p) => sum + Number(p.total_due), 0);
  const totalPaid = filtered.reduce((sum, p) => sum + Number(p.total_paid), 0);
  const totalOutstanding = filtered.reduce((sum, p) => sum + (Number(p.total_due) - Number(p.total_paid)), 0);

  // Add payment transaction for a payment row
  const handleAddPayment = async (payment: any) => {
    const outstanding = Number(payment.total_due) - Number(payment.total_paid);
    const state = addPayment[payment.id] || { amount: "", notes: "", loading: false, error: "" };
    if (!state.amount || isNaN(Number(state.amount)) || Number(state.amount) <= 0) {
      setAddPayment(prev => ({ ...prev, [payment.id]: { ...state, error: "Enter a valid amount." } }));
      return;
    }
    if (Number(state.amount) > outstanding) {
      setAddPayment(prev => ({ ...prev, [payment.id]: { ...state, error: "Cannot pay more than outstanding amount." } }));
      return;
    }
    setAddPayment(prev => ({ ...prev, [payment.id]: { ...state, loading: true, error: "" } }));
    try {
      const { error } = await supabase.rpc('add_order_payment_transaction_atomic', {
        payment_id: payment.id,
        amount: Number(state.amount),
        transaction_type: 'payment',
        notes: state.notes || null
      });
      if (error) throw error;
      // Refresh payments
      const { data, error: fetchError } = await supabase
        .from('order_payments')
        .select('*, vendor:vendor_id(*), order:order_id(*)')
        .order('created_at', { ascending: false });
      if (!fetchError) {
        setPayments(data || []);
        setFiltered(data || []);
      }
      setAddPayment(prev => ({ ...prev, [payment.id]: { amount: "", notes: "", loading: false, error: "" } }));
    } catch (e: any) {
      setAddPayment(prev => ({ ...prev, [payment.id]: { ...state, loading: false, error: e.message || "Failed to add payment" } }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-admin-slate mb-4">Payments</h2>
      <Card className="shadow-sm mb-4">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by order ID or vendor name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Payment Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={orderStatusFilter}
            onChange={e => setOrderStatusFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Order Status</option>
            {allOrderStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-8 mb-4">
            <div>
              <div className="text-xs text-gray-500">Total Due</div>
              <div className="font-bold text-lg text-blue-700">₹{totalDue}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Paid</div>
              <div className="font-bold text-lg text-green-700">₹{totalPaid}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Outstanding</div>
              <div className="font-bold text-lg text-red-700">₹{totalOutstanding}</div>
            </div>
          </div>
          {loading ? (
            <div>Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">No payments found.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Vendor</th>
                  <th className="p-2 text-left">Order Status</th>
                  <th className="p-2 text-left">Total Due</th>
                  <th className="p-2 text-left">Total Paid</th>
                  <th className="p-2 text-left">Outstanding</th>
                  <th className="p-2 text-left">Payment Status</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">Add Payment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = getStatus(p);
                  const outstanding = Number(p.total_due) - Number(p.total_paid);
                  const state = addPayment[p.id] || { amount: "", notes: "", loading: false, error: "" };
                  return (
                    <tr key={p.id}>
                      <td className="p-2 font-mono text-xs">{p.order_id}</td>
                      <td className="p-2">{p.vendor?.business_name || p.vendor_id}</td>
                      <td className="p-2">{p.order?.status || "-"}</td>
                      <td className="p-2 text-blue-700 font-semibold">₹{p.total_due}</td>
                      <td className="p-2 text-green-700 font-semibold">₹{p.total_paid}</td>
                      <td className="p-2 text-red-700 font-semibold">₹{outstanding}</td>
                      <td className="p-2">
                        {status === "Paid" ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Paid</span>
                        ) : status === "Partial" ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Partial</span>
                        ) : status === "Unpaid" ? (
                          <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">Unpaid</span>
                        ) : null}
                      </td>
                      <td className="p-2 text-xs">{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
                      <td className="p-2">
                        {status !== "Paid" && (
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                min={1}
                                max={outstanding}
                                value={state.amount}
                                onChange={e => setAddPayment(prev => ({ ...prev, [p.id]: { ...state, amount: e.target.value } }))}
                                placeholder="Amount"
                                className="w-20"
                                disabled={state.loading}
                              />
                              <Input
                                value={state.notes}
                                onChange={e => setAddPayment(prev => ({ ...prev, [p.id]: { ...state, notes: e.target.value } }))}
                                placeholder="Notes"
                                className="w-32"
                                disabled={state.loading}
                              />
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:bg-gray-400"
                                onClick={() => handleAddPayment(p)}
                                disabled={state.loading}
                              >
                                {state.loading ? "Saving..." : "Add"}
                              </button>
                            </div>
                            {state.error && <div className="text-xs text-red-600 mt-1">{state.error}</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 