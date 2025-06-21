import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit } from "lucide-react";
import type { Order } from "@shared/schema";

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  onViewOrder: (orderId: string) => void;
  onEditOrder?: (orderId: string) => void;
}

export function OrdersTable({ orders, isLoading, onViewOrder, onEditOrder }: OrdersTableProps) {
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

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No orders found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Order ID</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Customer</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Contact</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Service Type</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Pickup Location</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Price</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6 font-medium text-admin-slate">
                #{order.id.slice(0, 8)}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={(order as any).profile?.avatarUrl || ""} />
                    <AvatarFallback>
                      {(order as any).profile?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-admin-slate">
                      {(order as any).profile?.fullName || "Unknown Customer"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(order as any).profile?.email || "No email provided"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-admin-slate">
                {(order as any).profile?.phoneNumber || "Not provided"}
              </td>
              <td className="py-4 px-6 text-admin-slate">{order.serviceType}</td>
              <td className="py-4 px-6 text-admin-slate">{order.pickupAddress}</td>
              <td className="py-4 px-6">
                {getStatusBadge(order.status || "Pending")}
              </td>
              <td className="py-4 px-6 text-admin-slate">
                {formatCurrency(order.approxPrice)}
              </td>
              <td className="py-4 px-6">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewOrder(order.id)}
                    className="text-primary-custom hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditOrder ? onEditOrder(order.id) : onViewOrder(order.id)}
                    className="text-warning-custom hover:text-yellow-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="p-6 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing 1-{orders.length} of {orders.length} orders
        </span>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
