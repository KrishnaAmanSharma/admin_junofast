import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrdersTable } from "@/components/tables/orders-table";
import { OrderDetailsModal } from "@/components/modals/order-details-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import type { Order, ServiceType } from "@shared/schema";

export default function Orders() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    serviceType: "",
    dateRange: "",
  });

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", filters],
    enabled: true,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== '') {
        params.append('status', filters.status);
      }
      if (filters.serviceType && filters.serviceType !== '') {
        params.append('serviceType', filters.serviceType);
      }
      if (filters.dateRange && filters.dateRange !== '') {
        params.append('dateRange', filters.dateRange);
      }
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting orders...");
  };

  return (
    <div>
      <Header title="Orders Management" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-admin-slate">Orders Management</h2>
          <Button onClick={handleExport} className="bg-primary-custom hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Orders
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2">
                  Status
                </Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Status">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Price Updated">Price Updated</SelectItem>
                    <SelectItem value="Price Accepted">Price Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="serviceType" className="text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </Label>
                <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Services">All Services</SelectItem>
                    {serviceTypes?.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dateRange" className="text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </Label>
                <Input
                  id="dateRange"
                  type="date"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="w-full bg-primary-custom hover:bg-blue-700"
                  onClick={() => {
                    // Trigger refetch with filters
                    window.location.reload();
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-admin-slate mb-4">All Orders</h3>
            <OrdersTable 
              orders={orders || []} 
              isLoading={isLoading}
              onViewOrder={setSelectedOrderId}
              onEditOrder={setSelectedOrderId}
            />
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
