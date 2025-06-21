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
} from "lucide-react";
import { useState } from "react";
import type { Order, Profile } from "@shared/schema";

type OrderWithProfile = Order & { profile: Profile | null };

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-admin-slate">
                    {metrics?.totalOrders?.toLocaleString() || 0}
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
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-admin-slate">
                    {formatCurrency(metrics?.totalRevenue || 0)}
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
                  <p className="text-sm font-medium text-gray-500">Active Orders</p>
                  <p className="text-2xl font-bold text-admin-slate">
                    {metrics?.activeOrders || 0}
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
                  <p className="text-sm font-medium text-gray-500">New Users</p>
                  <p className="text-2xl font-bold text-admin-slate">
                    {metrics?.newUsers || 0}
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
            <h3 className="text-lg font-semibold text-admin-slate mb-4">
              Recent Orders Requiring Attention
            </h3>
            
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
    </div>
  );
}
