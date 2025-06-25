import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [assignmentType, setAssignmentType] = useState("single"); // single, broadcast
  const [broadcastCriteria, setBroadcastCriteria] = useState({
    cities: [] as string[],
    minRating: 0,
    maxVendors: 10
  });
  const { toast } = useToast();

  const { data: orderDetails, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    enabled: isOpen && !!orderId,
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      return response.json();
    }
  });

  // Helper function to extract city from address
  const extractCityFromAddress = (address: string | null) => {
    if (!address) return null;
    // Simple extraction - you might want to enhance this based on your address format
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : null;
  };

  // Vendor responses query
  const { data: vendorResponses, isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/orders", orderId, "vendor-responses"],
    enabled: isOpen && !!orderId,
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/vendor-responses`);
      if (!response.ok) throw new Error('Failed to fetch vendor responses');
      return response.json();
    }
  });

  const { data: allVendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: isOpen,
    queryFn: async () => {
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    }
  });

  // Filter vendors client-side like in the vendors page
  const vendors = allVendors.filter((vendor: any) => {
    // Only show approved vendors for order assignment
    if (vendor.status !== 'approved') return false;
    
    // For now, show all approved vendors regardless of service type to ensure they appear
    // TODO: Re-enable service type filtering once confirmed working
    // const serviceTypeMatch = !orderDetails?.order?.serviceType || 
    //   vendor.service_types?.includes(orderDetails.order.serviceType);
    const serviceTypeMatch = true;
    
    // Filter by vendor filter selection
    let statusMatch = true;
    if (vendorFilter === 'online') {
      statusMatch = vendor.is_online === true;
    }
    // 'all' and 'approved' both show approved vendors since we already filtered above
    
    return serviceTypeMatch && statusMatch;
  });



  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/orders/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      setNewPrice("");
      setNewStatus("");
      setSelectedVendor("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const assignVendorMutation = useMutation({
    mutationFn: async ({ orderId, vendorIds, assignmentType }: { 
      orderId: string; 
      vendorIds: string | string[]; 
      assignmentType: string;
    }) => {
      // Both single and broadcast now use the broadcast system
      await apiRequest("POST", `/api/orders/${orderId}/broadcast`, { 
        vendorIds: Array.isArray(vendorIds) ? vendorIds : [vendorIds],
        criteria: broadcastCriteria,
        assignmentType 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: assignmentType === "single" ? "Order sent to vendor - awaiting acceptance" : "Order broadcasted to vendors successfully",
      });
      setSelectedVendor("");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || (assignmentType === "single" ? "Failed to assign vendor" : "Failed to broadcast order");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleUpdatePrice = () => {
    if (!newPrice || !orderId) return;
    
    const updates: any = {
      approxPrice: newPrice,
      status: "Price Updated",
    };
    
    updateOrderMutation.mutate({
      id: orderId,
      updates,
    });
  };

  const handleUpdateStatus = () => {
    if (!newStatus || !orderId) return;
    
    const updates: any = {
      status: newStatus,
    };
    
    updateOrderMutation.mutate({
      id: orderId,
      updates,
    });
  };

  const handleAssignVendor = () => {
    if (!orderId) return;
    
    // Check if order has a valid price set before broadcasting
    const currentPrice = orderDetails?.order?.approxPrice;
    if (!currentPrice || currentPrice <= 0) {
      toast({
        title: "Price Required",
        description: "Please set a valid price for this order before assigning to vendors",
        variant: "destructive",
      });
      return;
    }
    
    if (assignmentType === "single") {
      if (!selectedVendor) return;
      assignVendorMutation.mutate({
        orderId,
        vendorIds: selectedVendor,
        assignmentType: "single"
      });
    } else {
      // Broadcast to filtered vendors
      const selectedVendorIds = getFilteredVendorsForBroadcast();
      if (selectedVendorIds.length === 0) {
        toast({
          title: "Error",
          description: "No vendors match the broadcast criteria",
          variant: "destructive",
        });
        return;
      }
      
      assignVendorMutation.mutate({
        orderId,
        vendorIds: selectedVendorIds,
        assignmentType: "broadcast"
      });
    }
  };

  const getFilteredVendorsForBroadcast = () => {
    let filteredVendors = vendors;
    
    // Filter by cities if specified
    if (broadcastCriteria.cities.length > 0) {
      filteredVendors = filteredVendors.filter((vendor: any) => 
        broadcastCriteria.cities.includes(vendor.city)
      );
    }
    
    // Filter by minimum rating
    if (broadcastCriteria.minRating > 0) {
      filteredVendors = filteredVendors.filter((vendor: any) => 
        (vendor.rating || 0) >= broadcastCriteria.minRating
      );
    }
    
    // Limit number of vendors
    if (broadcastCriteria.maxVendors > 0) {
      filteredVendors = filteredVendors.slice(0, broadcastCriteria.maxVendors);
    }
    
    return filteredVendors.map((vendor: any) => vendor.id);
  };

  const getUniqueCities = (): string[] => {
    const cities = allVendors
      .filter((vendor: any) => vendor.status === 'approved')
      .map((vendor: any) => vendor.city)
      .filter(Boolean) as string[];
    return Array.from(new Set(cities));
  };

  const handleApprovePrice = async (responseId: string, approved: boolean, proposedPrice?: number) => {
    try {
      const updates: any = {
        approved,
        adminResponse: approved ? "Price approved by admin" : "Price rejected by admin"
      };

      // If price is approved, update the order price
      if (approved && proposedPrice) {
        updates.updateOrderPrice = proposedPrice;
      }

      await apiRequest("POST", `/api/orders/${orderId}/approve-price/${responseId}`, updates);
      
      // Refresh vendor responses
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "vendor-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      toast({
        title: approved ? "Price Approved" : "Price Rejected",
        description: approved ? "Vendor price has been approved and order updated" : "Vendor price request has been rejected",
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || "Failed to process price approval";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleApproveVendor = async (responseId: string, vendorId: string, proposedPrice?: number) => {
    try {
      // First approve the vendor response
      await apiRequest("POST", `/api/orders/${orderId}/approve-price/${responseId}`, {
        approved: true,
        adminResponse: "Vendor approved and assigned to order"
      });

      // Then update the order with vendor assignment and status
      const orderUpdates: any = {
        status: "Confirmed",
        vendorId: vendorId
      };

      // Update price if proposed
      if (proposedPrice) {
        orderUpdates.approxPrice = proposedPrice;
      }

      await apiRequest("PUT", `/api/orders/${orderId}`, orderUpdates);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/vendor-responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Success",
        description: "Vendor approved and assigned to order",
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || "Failed to approve vendor";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRejectVendor = async (responseId: string) => {
    try {
      await apiRequest("POST", `/api/orders/${orderId}/approve-price/${responseId}`, {
        approved: false,
        adminResponse: "Vendor application rejected"
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/vendor-responses`] });
      
      toast({
        title: "Success",
        description: "Vendor application rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject vendor",
        variant: "destructive",
      });
    }
  };;

  const currentStatus = orderDetails?.order?.status;
  const canEditPrice = currentStatus === "Pending" || currentStatus === "Price Updated";

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
      <span 
        className={`px-2 py-1 text-xs rounded ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-admin-slate">
              Order Details - #{orderId}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Complete order information including items, questions, and delivery details
          </DialogDescription>
        </DialogHeader>

        {isLoading || !orderDetails ? (
          <div className="space-y-6 p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !orderDetails ? (
          <div className="p-6 text-center text-gray-500">
            Order not found or failed to load.
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Order and Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    <span>{orderDetails?.profile?.fullName || orderDetails?.profile?.email || "Unknown"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    <span>{orderDetails?.profile?.email || "Not available"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    <span>{orderDetails?.profile?.phoneNumber || "Not provided"}</span>
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Order ID:</span>{" "}
                    <span className="font-mono text-xs break-all bg-gray-100 px-2 py-1 rounded">
                      {orderDetails?.order?.id}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Service:</span>{" "}
                    <span>{orderDetails?.order?.serviceType || "Not specified"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(orderDetails?.order?.status || "Pending")}
                  </p>
                  <p>
                    <span className="font-medium">Current Price:</span>{" "}
                    <span className={`font-semibold ${
                      (!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {(!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) 
                        ? 'Not Set' 
                        : formatCurrency(orderDetails?.order?.approxPrice)
                      }
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">User ID:</span>{" "}
                    <span className="font-mono text-xs">{orderDetails?.order?.userId || "Not available"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    <span>
                      {orderDetails?.order?.createdAt 
                        ? new Date(orderDetails.order.createdAt).toLocaleString()
                        : "Unknown"
                      }
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Last Updated:</span>{" "}
                    <span>
                      {orderDetails?.order?.updatedAt 
                        ? new Date(orderDetails.order.updatedAt).toLocaleString()
                        : "Unknown"
                      }
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Management Section */}
            <div className="space-y-6">
              <h4 className="font-semibold text-admin-slate mb-3">Order Management</h4>
              
              {/* Price Validation Alert */}
              {(!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h6 className="font-medium text-amber-800">Price Required</h6>
                      <p className="text-sm text-amber-700">
                        Please set a valid price for this order before assigning to vendors. Use the "Update Price" section below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Vendor Details - Show when vendor is assigned */}
              {orderDetails?.order?.vendorId ? (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-admin-slate">Assigned Vendor</h5>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Confirmed
                    </Badge>
                  </div>
                  
                  {/* Find and display assigned vendor details */}
                  {(() => {
                    const assignedVendor = allVendors.find((vendor: any) => vendor.id === orderDetails.order.vendorId);
                    if (!assignedVendor) {
                      return (
                        <div className="text-sm text-gray-600">
                          Vendor details not available
                        </div>
                      );
                    }
                    
                    return (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div>
                              <h6 className="font-semibold text-lg">{assignedVendor.business_name}</h6>
                              <p className="text-gray-600">{assignedVendor.full_name}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Phone:</span>
                                <p className="text-gray-600">{assignedVendor.phone_number}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Email:</span>
                                <p className="text-gray-600">{assignedVendor.email}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">City:</span>
                                <p className="text-gray-600">{assignedVendor.city}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Rating:</span>
                                <p className="text-gray-600">{assignedVendor.rating || 0}/5 ⭐</p>
                              </div>
                            </div>
                            
                            {assignedVendor.address && (
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Address:</span>
                                <p className="text-gray-600">{assignedVendor.address}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700">Status:</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  assignedVendor.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {assignedVendor.is_online ? 'Online' : 'Offline'}
                                </span>
                                <span className="text-gray-500">
                                  Total Orders: {assignedVendor.total_orders || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // Vendor Assignment Interface - Show when no vendor assigned
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-admin-slate">Vendor Assignment</h5>
                  </div>

                {/* Assignment Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Assignment Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="single"
                        checked={assignmentType === "single"}
                        onChange={(e) => setAssignmentType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Single Vendor Assignment</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="broadcast"
                        checked={assignmentType === "broadcast"}
                        onChange={(e) => setAssignmentType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Broadcast to Multiple Vendors</span>
                    </label>
                  </div>
                </div>

                {assignmentType === "single" ? (
                  // Single Vendor Assignment
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={vendorFilter} onValueChange={setVendorFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter vendors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vendors</SelectItem>
                          <SelectItem value="approved">Approved Only</SelectItem>
                          <SelectItem value="online">Online Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-gray-600 flex items-center">
                        {vendorsLoading ? "Loading..." : `${vendors.length} vendors`}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {allVendors
                            .filter((vendor: any) => vendor.status === 'approved')
                            .map((vendor: any) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.business_name} ({vendor.full_name}) - {vendor.city}
                                {vendor.is_online && " 🟢"}
                              </SelectItem>
                            ))}
                          {allVendors.filter((vendor: any) => vendor.status === 'approved').length === 0 && (
                            <SelectItem value="no-vendors" disabled>
                              {vendorsLoading ? "Loading vendors..." : "No approved vendors available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleAssignVendor}
                        disabled={
                          assignVendorMutation.isPending || 
                          !selectedVendor || 
                          selectedVendor === "no-vendors" ||
                          !orderDetails?.order?.approxPrice ||
                          orderDetails?.order?.approxPrice <= 0
                        }
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {assignVendorMutation.isPending ? "Sending..." : 
                         (!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) ? "Price Required" :
                         "Send to Vendor"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Broadcast Assignment
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* City Selection */}
                      <div>
                        <Label className="text-sm font-medium">Cities (Optional)</Label>
                        <Select 
                          value={broadcastCriteria.cities.join(",")} 
                          onValueChange={(value) => 
                            setBroadcastCriteria(prev => ({
                              ...prev, 
                              cities: value === "all-cities" ? [] : value ? value.split(",") : []
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All cities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-cities">All Cities</SelectItem>
                            {getUniqueCities().map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Minimum Rating */}
                      <div>
                        <Label className="text-sm font-medium">Minimum Rating</Label>
                        <Select 
                          value={broadcastCriteria.minRating.toString()} 
                          onValueChange={(value) => 
                            setBroadcastCriteria(prev => ({...prev, minRating: parseFloat(value)}))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any Rating</SelectItem>
                            <SelectItem value="3">3+ Stars</SelectItem>
                            <SelectItem value="4">4+ Stars</SelectItem>
                            <SelectItem value="4.5">4.5+ Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Max Vendors to Notify</Label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={broadcastCriteria.maxVendors}
                          onChange={(e) => 
                            setBroadcastCriteria(prev => ({
                              ...prev, 
                              maxVendors: parseInt(e.target.value) || 10
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="10"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        {getFilteredVendorsForBroadcast().length} vendors will be notified
                      </div>
                      <Button 
                        onClick={handleAssignVendor}
                        disabled={
                          assignVendorMutation.isPending || 
                          getFilteredVendorsForBroadcast().length === 0 ||
                          !orderDetails?.order?.approxPrice ||
                          orderDetails?.order?.approxPrice <= 0
                        }
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        {assignVendorMutation.isPending ? "Broadcasting..." : 
                         (!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) ? "Price Required" :
                         "Broadcast Order"}
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              )}

              {/* Vendor Responses Section - Only show when no vendor is assigned */}
              {!orderDetails?.order?.vendorId && vendorResponses && (vendorResponses.broadcasts?.length > 0 || vendorResponses.responses?.length > 0) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h6 className="font-medium text-admin-slate mb-3">Vendor Responses</h6>
                    
                    {/* Broadcasts Status */}
                    {vendorResponses.broadcasts?.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-medium text-gray-700">Sent to {vendorResponses.broadcasts.length} vendors:</p>
                        <div className="grid gap-2">
                          {vendorResponses.broadcasts.map((broadcast: any) => (
                            <div key={broadcast.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                              <div>
                                <span className="font-medium">{broadcast.vendor_profiles?.business_name}</span>
                                <span className="text-gray-500 ml-2">({broadcast.vendor_profiles?.city})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  broadcast.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  broadcast.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  broadcast.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {broadcast.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(broadcast.broadcast_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendor Acceptances */}
                    {vendorResponses.responses?.some((r: any) => r.response_type === 'accept') && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Vendor Acceptances:</p>
                        <div className="grid gap-2">
                          {vendorResponses.responses
                            .filter((response: any) => response.response_type === 'accept')
                            .map((response: any) => (
                            <div key={response.id} className="p-3 bg-green-50 rounded border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-medium">{response.vendor_profiles?.business_name}</span>
                                  <span className="text-gray-500 ml-2">({response.vendor_profiles?.full_name})</span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {response.vendor_profiles?.city} • {response.vendor_profiles?.phone_number}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    response.admin_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {response.admin_approved ? 'Confirmed' : 'Awaiting Approval'}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(response.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              {response.message && (
                                <p className="text-sm text-gray-600 mb-2 italic">"{response.message}"</p>
                              )}
                              {response.proposed_price && (
                                <div className="text-sm text-green-700 mb-2 font-medium">
                                  Quoted Price: ₹{response.proposed_price}
                                </div>
                              )}
                              {!response.admin_approved && (
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApproveVendor(response.id, response.vendor_id, response.proposed_price)}
                                  >
                                    Approve & Assign
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRejectVendor(response.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Update Requests */}
                    {vendorResponses.responses?.some((r: any) => r.response_type === 'price_update') && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Price Update Requests:</p>
                        <div className="grid gap-2">
                          {vendorResponses.responses
                            .filter((response: any) => response.response_type === 'price_update')
                            .map((response: any) => (
                            <div key={response.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{response.vendor_profiles?.business_name}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  response.admin_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {response.admin_approved ? 'Price Approved' : 'Pending Review'}
                                </span>
                              </div>
                              {response.proposed_price && (
                                <div className="text-sm text-gray-600 mb-2">
                                  Requested Price: ₹{response.proposed_price}
                                  {response.original_price && (
                                    <span className="ml-2 text-gray-400">(Original: ₹{response.original_price})</span>
                                  )}
                                </div>
                              )}
                              {response.message && (
                                <p className="text-sm text-gray-600 mb-2 italic">"{response.message}"</p>
                              )}
                              {!response.admin_approved && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleApprovePrice(response.id, true, response.proposed_price)}
                                  >
                                    Approve Price
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleApprovePrice(response.id, false)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
              
            {/* Status Update */}
            <div className="space-y-6">
              <h4 className="font-semibold text-admin-slate mb-3">Order Management</h4>
              
              <div className="max-w-md">
                <Label htmlFor="newStatus" className="text-sm font-medium text-gray-700">
                  Update Status
                </Label>
                <div className="flex gap-2 mt-1">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Price Updated">Price Updated</SelectItem>
                      <SelectItem value="Price Accepted">Price Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleUpdateStatus}
                    disabled={updateOrderMutation.isPending || !newStatus}
                    size="sm"
                    variant="outline"
                  >
                    {updateOrderMutation.isPending ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>

              {/* Price Update */}
              <div className="max-w-md">
                <Label htmlFor="newPrice" className="text-sm font-medium text-gray-700">
                  Update Price (₹)
                  {!canEditPrice && (
                    <span className="text-red-500 text-xs ml-2">
                      (Price locked - only editable when Pending or Price Updated)
                    </span>
                  )}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="newPrice"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder={canEditPrice ? "Enter new price" : "Price cannot be changed"}
                    className="flex-1"
                    disabled={!canEditPrice}
                  />
                  <Button 
                    onClick={handleUpdatePrice}
                    disabled={updateOrderMutation.isPending || !newPrice || !canEditPrice}
                    size="sm"
                  >
                    {updateOrderMutation.isPending ? "Updating..." : "Update Price"}
                  </Button>
                </div>
                {!canEditPrice && (
                  <p className="text-xs text-amber-600 mt-1">
                    Price can only be modified when order status is "Pending" or "Price Updated".
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Pickup Location</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {orderDetails?.order?.pickupAddress || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Pincode:</span>{" "}
                    {orderDetails?.order?.pickupPincode || "Not provided"}
                  </p>
                  {(orderDetails?.order?.pickupLatitude || orderDetails?.order?.pickupLongitude) && (
                    <p>
                      <span className="font-medium">Coordinates:</span>{" "}
                      <span className="font-mono text-xs">
                        {orderDetails?.order?.pickupLatitude?.toFixed(6) || "N/A"}, {orderDetails?.order?.pickupLongitude?.toFixed(6) || "N/A"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Drop Location</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {orderDetails?.order?.dropAddress || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Pincode:</span>{" "}
                    {orderDetails?.order?.dropPincode || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            
            {/* Common Items */}
            <div>
              <h4 className="font-semibold text-admin-slate mb-3">Common Items</h4>
              {orderDetails?.commonItems && orderDetails.commonItems.length > 0 ? (
                <div className="space-y-2">
                  {orderDetails.commonItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={item.image_url || ""} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="font-medium text-admin-slate">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No common items selected for this order
                </div>
              )}
            </div>

            <Separator />
            
            {/* Custom Items */}
            <div>
              <h4 className="font-semibold text-admin-slate mb-3">Custom Items</h4>
              {orderDetails?.customItems && orderDetails.customItems.length > 0 ? (
                <div className="space-y-2">
                  {orderDetails.customItems.map((item: any) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-admin-slate">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <p className="font-medium">Qty: {item.quantity}</p>
                      </div>
                      {item.photos && item.photos.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {item.photos.map((photo: any) => (
                            <img 
                              key={photo.id}
                              src={photo.photoUrl} 
                              alt="Item photo"
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No custom items added for this order
                </div>
              )}
            </div>

            <Separator />
            
            {/* Question Answers */}
            <div>
              <h4 className="font-semibold text-admin-slate mb-3">Service Questions</h4>
              {orderDetails?.questionAnswers && orderDetails.questionAnswers.length > 0 ? (
                <div className="space-y-3">
                  {orderDetails.questionAnswers.map((qa: any) => (
                    <div key={qa.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-admin-slate mb-1">{qa.question}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded border">
                          {qa.questionType}
                        </span>
                        <span>{qa.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No service questions answered for this order
                </div>
              )}
            </div>

            <Separator />
            
            {/* Order Details */}
            <div>
              <h4 className="font-semibold text-admin-slate mb-3">Additional Order Details</h4>
              {orderDetails?.orderDetails && orderDetails.orderDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderDetails.orderDetails.map((detail: any) => (
                    <div key={detail.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium text-admin-slate capitalize">
                          {detail.name.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-600 break-words">
                          {detail.value}
                        </span>
                        {detail.created_at && (
                          <span className="text-xs text-gray-400">
                            Added: {new Date(detail.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  No additional details recorded for this order
                </div>
              )}
            </div>

            
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
