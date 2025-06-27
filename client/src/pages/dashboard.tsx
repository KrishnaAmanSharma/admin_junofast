import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDetailsModal } from "@/components/modals/order-details-modal";
import {
  Package,
  IndianRupee,
  Clock,
  UserPlus,
  Eye,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import type { Order, Profile } from "@shared/schema";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type OrderWithProfile = Order & { profile: Profile | null };

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<OrderWithProfile[]>({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Confirmed": "bg-green-100 text-green-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Completed": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Price Updated": "bg-orange-100 text-orange-800",
      "Price Accepted": "bg-green-100 text-green-800",
    };

    return (
      <Badge 
        variant="secondary" 
        className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
      >
        {status}
      </Badge>
    );
  };

  // Ensure metrics is always an object
  const safeMetrics = metrics && typeof metrics === 'object' ? metrics as Record<string, any> : {};

  if (metricsLoading || ordersLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-blue-600" onClick={() => setSelectedInfo('totalOrders')}>
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-admin-slate">
                    {(safeMetrics.totalOrders != null ? safeMetrics.totalOrders.toLocaleString() : 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Package className="text-primary-custom" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-green-600" onClick={() => setSelectedInfo('totalRevenue')}>
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-admin-slate">
                    {formatCurrency(safeMetrics.totalRevenue != null ? safeMetrics.totalRevenue : 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <IndianRupee className="text-secondary-custom" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-500">Active Orders</p>
                    <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-yellow-600" onClick={() => setSelectedInfo('activeOrders')}>
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-admin-slate">
                    {(safeMetrics.activeOrders != null ? safeMetrics.activeOrders : 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="text-warning-custom" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-500">New Users</p>
                    <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-purple-600" onClick={() => setSelectedInfo('newUsers')}>
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold text-admin-slate">
                    {(safeMetrics.newUsers != null ? safeMetrics.newUsers : 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <UserPlus className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Requiring Attention */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-admin-slate">Recent Orders Requiring Attention</h3>
              <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-blue-600" onClick={() => setSelectedInfo('recentOrders')}>
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
            
            {!recentOrders || recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders requiring attention at the moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Service</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-admin-slate">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4">
                          {order.profile?.fullName || "Unknown User"}
                        </td>
                        <td className="py-3 px-4 text-admin-slate">{order.serviceType}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(order.status || "Pending")}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="text-primary-custom hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Info Dialogs */}
      <Dialog open={!!selectedInfo} onOpenChange={() => setSelectedInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedInfo === 'totalOrders' && 'Total Orders - Complete Guide'}
              {selectedInfo === 'totalRevenue' && 'Total Revenue - Complete Guide'}
              {selectedInfo === 'activeOrders' && 'Active Orders - Complete Guide'}
              {selectedInfo === 'newUsers' && 'New Users - Complete Guide'}
              {selectedInfo === 'recentOrders' && 'Recent Orders Requiring Attention - Complete Guide'}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo === 'totalOrders' && (
                <>
                  <b>What is this?</b><br/>
                  The total number of orders placed in your system, including all statuses.<br/><br/>
                  <b>Why is it important?</b><br/>
                  This metric helps you understand your business's overall activity and growth. A rising order count can indicate successful marketing, customer satisfaction, or seasonal trends.<br/><br/>
                  <b>How to use:</b>
                  <ul className="list-disc ml-6">
                    <li>Monitor for sudden spikes or drops to identify issues or opportunities</li>
                    <li>Compare with previous periods to track growth</li>
                    <li>Use in business reviews and reporting</li>
                  </ul>
                  <br/>
                  <b>Best Practices:</b>
                  <ul className="list-disc ml-6">
                    <li>Combine with filters (date, service type) for deeper insights</li>
                    <li>Set targets and review progress regularly</li>
                  </ul>
                  <br/>
                  <b>Example Scenario:</b><br/>
                  If you notice a drop in total orders this month, investigate possible causes such as marketing changes, competitor activity, or service issues.
                </>
              )}
              {selectedInfo === 'totalRevenue' && (
                <>
                  <b>What is this?</b><br/>
                  The total revenue generated from all completed orders.<br/><br/>
                  <b>Why is it important?</b><br/>
                  Revenue is a key indicator of business health and profitability. Tracking it helps you plan for growth and manage expenses.<br/><br/>
                  <b>How to use:</b>
                  <ul className="list-disc ml-6">
                    <li>Set monthly/quarterly revenue goals</li>
                    <li>Analyze trends to forecast future performance</li>
                    <li>Compare with costs to assess profitability</li>
                  </ul>
                  <br/>
                  <b>Best Practices:</b>
                  <ul className="list-disc ml-6">
                    <li>Review revenue alongside order volume for a complete picture</li>
                    <li>Investigate large fluctuations promptly</li>
                  </ul>
                  <br/>
                  <b>Example Scenario:</b><br/>
                  If revenue increases but order count stays flat, you may be successfully upselling or increasing prices.
                </>
              )}
              {selectedInfo === 'activeOrders' && (
                <>
                  <b>What is this?</b><br/>
                  The number of orders that are currently in progress and not yet completed.<br/><br/>
                  <b>Why is it important?</b><br/>
                  This shows your team's current workload and helps you manage resources efficiently.<br/><br/>
                  <b>How to use:</b>
                  <ul className="list-disc ml-6">
                    <li>Monitor to avoid overloading your team</li>
                    <li>Identify bottlenecks in order processing</li>
                  </ul>
                  <br/>
                  <b>Best Practices:</b>
                  <ul className="list-disc ml-6">
                    <li>Check regularly to ensure timely completion</li>
                    <li>Use with status filters to drill down</li>
                  </ul>
                  <br/>
                  <b>Example Scenario:</b><br/>
                  If active orders are piling up, consider adding staff or improving processes.
                </>
              )}
              {selectedInfo === 'newUsers' && (
                <>
                  <b>What is this?</b><br/>
                  The number of users who registered recently.<br/><br/>
                  <b>Why is it important?</b><br/>
                  New user signups reflect your business's reach and marketing effectiveness.<br/><br/>
                  <b>How to use:</b>
                  <ul className="list-disc ml-6">
                    <li>Track user growth and engagement</li>
                    <li>Measure effectiveness of marketing campaigns</li>
                  </ul>
                  <br/>
                  <b>Best Practices:</b>
                  <ul className="list-disc ml-6">
                    <li>Engage new users with onboarding emails</li>
                    <li>Monitor for sudden drops to catch issues early</li>
                  </ul>
                  <br/>
                  <b>Example Scenario:</b><br/>
                  If new user signups spike after a campaign, analyze what worked and replicate it.
                </>
              )}
              {selectedInfo === 'recentOrders' && (
                <>
                  <b>What is this?</b><br/>
                  A table of orders that require your immediate attention, such as pending actions, updates, or follow-ups.<br/><br/>
                  <b>Why is it important?</b><br/>
                  Quickly addressing these orders improves customer satisfaction and keeps your workflow efficient.<br/><br/>
                  <b>How to use:</b>
                  <ul className="list-disc ml-6">
                    <li>Review this section daily for urgent tasks</li>
                    <li>Click "View Details" to manage the order</li>
                  </ul>
                  <br/>
                  <b>Best Practices:</b>
                  <ul className="list-disc ml-6">
                    <li>Assign team members to monitor this section</li>
                    <li>Follow up promptly to avoid delays</li>
                  </ul>
                  <br/>
                  <b>Example Scenario:</b><br/>
                  If an order remains in this section for too long, investigate and resolve the issue to maintain service quality.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
