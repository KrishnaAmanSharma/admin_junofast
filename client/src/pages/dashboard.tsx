import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDetailsModal } from "@/components/modals/order-details-modal";
import {
  Eye,
} from "lucide-react";
import { useState } from "react";
import type { Order, Profile } from "@shared/schema";

type OrderWithProfile = Order & { profile: Profile | null };

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<OrderWithProfile[]>({
    queryKey: ["/api/dashboard/recent-orders"],
  });

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

  if (ordersLoading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6 space-y-6">

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
