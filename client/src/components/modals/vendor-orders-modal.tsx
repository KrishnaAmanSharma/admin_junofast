import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDetailsModal } from "./order-details-modal";
import { supabaseStorage } from "@/lib/supabase-client";
import { 
  Search, 
  Eye, 
  Calendar,
  MapPin,
  User,
  Package,
  IndianRupee,
  Clock,
  Star,
  TrendingUp,
  Activity
} from "lucide-react";

interface VendorOrdersModalProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VendorOrdersModal({ vendor, isOpen, onClose }: VendorOrdersModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    serviceType: "",
    dateRange: "",
  });

  // Fetch vendor orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", vendor?.id, filters, searchTerm],
    queryFn: () => supabaseStorage.getVendorOrders(vendor.id, {
      ...filters,
      search: searchTerm
    }),
    enabled: !!vendor?.id && isOpen,
  });

  // Fetch vendor metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["vendor-metrics", vendor?.id],
    queryFn: () => supabaseStorage.getVendorMetrics(vendor.id),
    enabled: !!vendor?.id && isOpen,
  });

  // Fetch service types for filter
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["service-types"],
    queryFn: () => supabaseStorage.getServiceTypes(),
    enabled: isOpen,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Confirmed": "bg-blue-100 text-blue-800",
      "In Progress": "bg-orange-100 text-orange-800",
      "Completed": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Price Updated": "bg-purple-100 text-purple-800",
      "Price Accepted": "bg-green-100 text-green-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!vendor) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              Orders for {vendor.business_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vendor Performance Metrics */}
            {!metricsLoading && metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{metrics.totalOrders}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{metrics.completedOrders}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <IndianRupee className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(metrics.totalEarnings)}
                    </div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {metrics.rating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders by ID, customer, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.serviceType} onValueChange={(value) => handleFilterChange("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                  placeholder="From date"
                />
                
                <Button 
                  onClick={() => setFilters({ status: "", serviceType: "", dateRange: "" })}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Orders ({orders.length})
              </h3>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filters.status || filters.serviceType || filters.dateRange
                      ? "Try adjusting your search or filters"
                      : "This vendor hasn't received any orders yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-medium text-admin-slate">
                                #{order.id.slice(0, 8)}
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                              <div className="text-sm text-gray-600">
                                {order.serviceType}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-4 w-4" />
                                {order.profile?.fullName || "Unknown Customer"}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                {order.pickupAddress?.substring(0, 30)}...
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {order.approxPrice && (
                              <div className="mt-2 flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                  {formatCurrency(order.approxPrice)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
}
