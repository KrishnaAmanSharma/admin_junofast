import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newStatus, setNewStatus] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [assignmentType, setAssignmentType] = useState("broadcast");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [maxVendors, setMaxVendors] = useState(10);

  // Fetch order details
  const { data: orderDetails, isLoading: orderLoading } = useQuery({
    queryKey: ['/api/orders', orderId, 'details'],
    enabled: !!orderId && isOpen,
  });

  // Fetch vendor responses
  const { data: vendorResponses } = useQuery({
    queryKey: ['/api/orders', orderId, 'vendor-responses'],
    enabled: !!orderId && isOpen,
  });

  // Fetch vendors for assignment
  const { data: vendors } = useQuery({
    queryKey: ['/api/vendors'],
    enabled: isOpen,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, price }: { status: string; price?: string }) => {
      const updates: any = { status };
      if (price) {
        updates.approxPrice = parseFloat(price);
      }
      return apiRequest(`/api/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({ title: "Order updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setNewStatus("");
      setNewPrice("");
    },
    onError: () => {
      toast({ title: "Error updating order", variant: "destructive" });
    },
  });

  // Vendor assignment mutation
  const assignVendorMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/orders/${orderId}/assign-vendor`, {
        method: "POST",
        body: JSON.stringify({
          filters: {
            city: cityFilter || undefined,
            minRating: ratingFilter ? parseFloat(ratingFilter) : undefined,
          },
          maxVendors,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Order broadcast to vendors successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({ title: "Error broadcasting order", variant: "destructive" });
    },
  });

  // Direct assignment mutation
  const directAssignMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      return apiRequest(`/api/orders/${orderId}/direct-assign`, {
        method: "POST",
        body: JSON.stringify({ vendorId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Vendor assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setSelectedVendorId("");
    },
    onError: () => {
      toast({ title: "Error assigning vendor", variant: "destructive" });
    },
  });

  // Approve vendor mutation
  const approveVendorMutation = useMutation({
    mutationFn: async ({ responseId, vendorId, proposedPrice }: { responseId: string; vendorId: string; proposedPrice?: number }) => {
      return apiRequest(`/api/vendor-responses/${responseId}/approve`, {
        method: "POST",
        body: JSON.stringify({ vendorId, proposedPrice }),
      });
    },
    onSuccess: () => {
      toast({ title: "Vendor approved and assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({ title: "Error approving vendor", variant: "destructive" });
    },
  });

  // Approve price mutation
  const approvePriceMutation = useMutation({
    mutationFn: async ({ responseId, approved }: { responseId: string; approved: boolean }) => {
      return apiRequest(`/api/vendor-responses/${responseId}/approve-price`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
    },
    onSuccess: () => {
      toast({ title: "Price update processed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({ title: "Error processing price update", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (orderDetails?.order) {
      setNewStatus(orderDetails.order.status);
      setNewPrice(orderDetails.order.approxPrice?.toString() || "");
    }
  }, [orderDetails]);

  const handleUpdateStatus = () => {
    if (newStatus) {
      updateStatusMutation.mutate({
        status: newStatus,
        price: newPrice || undefined,
      });
    }
  };

  const handleAssignVendor = () => {
    assignVendorMutation.mutate();
  };

  const handleDirectAssignment = (vendorId: string) => {
    if (vendorId) {
      directAssignMutation.mutate(vendorId);
    }
  };

  const handleApproveVendor = (responseId: string, vendorId: string, proposedPrice?: number) => {
    approveVendorMutation.mutate({ responseId, vendorId, proposedPrice });
  };

  const handleApprovePrice = (responseId: string, approved: boolean) => {
    approvePriceMutation.mutate({ responseId, approved });
  };

  // Filter vendors for broadcast
  const getFilteredVendorsForBroadcast = () => {
    if (!vendors) return [];
    
    return vendors.filter((vendor: any) => {
      if (cityFilter && vendor.city !== cityFilter) return false;
      if (ratingFilter && vendor.rating < parseFloat(ratingFilter)) return false;
      return true;
    }).slice(0, maxVendors);
  };

  // Get unique cities
  const uniqueCities = vendors ? [...new Set(vendors.map((v: any) => v.city).filter(Boolean))] : [];

  // Check if order is in final stage
  const isFinalStage = orderDetails?.order?.status && ['Confirmed', 'In Progress', 'Completed'].includes(orderDetails.order.status);

  if (orderLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Loading order details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orderDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-red-600">Error loading order details</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {orderDetails?.order?.id || 'Loading...'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    orderDetails.order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    orderDetails.order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    orderDetails.order.status === 'Confirmed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {orderDetails.order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service Type:</span>
                  <span>{orderDetails.order.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Approximate Price:</span>
                  <span>₹{orderDetails.order.approxPrice || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(orderDetails.order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              {orderDetails.profile ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{orderDetails.profile.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{orderDetails.profile.phone_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">City:</span>
                    <span>{orderDetails.profile.city}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Customer information not available</div>
              )}
            </div>
          </div>

          {/* Vendor Assignment Section - Only show for non-final stage orders */}
          {!isFinalStage && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-admin-slate">Vendor Assignment</h4>
              
              {/* Check if vendor is already assigned */}
              {orderDetails.order.assignedVendor ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-800 mb-2">Assigned Vendor</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Business:</span>
                      <span>{orderDetails.order.assignedVendor.business_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Contact:</span>
                      <span>{orderDetails.order.assignedVendor.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>{orderDetails.order.assignedVendor.phone_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">City:</span>
                      <span>{orderDetails.order.assignedVendor.city}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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

                  {/* Single Vendor Assignment */}
                  {assignmentType === "single" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Select Vendor</Label>
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredVendorsForBroadcast().map((vendor: any) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{vendor.business_name}</span>
                                <span className="text-xs text-gray-500">
                                  {vendor.city} • {vendor.phone_number}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => handleDirectAssignment(selectedVendorId)}
                        disabled={
                          directAssignMutation.isPending || 
                          !selectedVendorId ||
                          !orderDetails?.order?.approxPrice ||
                          orderDetails?.order?.approxPrice <= 0
                        }
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {directAssignMutation.isPending ? "Assigning..." : 
                         (!orderDetails?.order?.approxPrice || orderDetails?.order?.approxPrice <= 0) ? "Price Required" :
                         "Assign Vendor"}
                      </Button>
                    </div>
                  )}

                  {/* Broadcast Assignment */}
                  {assignmentType === "broadcast" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Vendor Selection Filters</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">City Filter</Label>
                          <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All cities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Cities</SelectItem>
                              {uniqueCities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-600">Rating Filter</Label>
                          <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All ratings" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Ratings</SelectItem>
                              <SelectItem value="4">4+ Stars</SelectItem>
                              <SelectItem value="3">3+ Stars</SelectItem>
                              <SelectItem value="2">2+ Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">Maximum Vendors to Notify</Label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={maxVendors}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              setMaxVendors(value);
                            }
                          }}
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vendor Responses Section - Only show for non-final stage orders */}
          {!isFinalStage && vendorResponses && (vendorResponses.broadcasts?.length > 0 || vendorResponses.responses?.length > 0) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h6 className="font-medium text-admin-slate mb-3">Vendor Responses</h6>
              
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

          {/* Order Management Section */}
          <div className="space-y-6">
            <h4 className="font-semibold text-admin-slate mb-3">Order Management</h4>
            
            {/* Status Update */}
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
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending || !newStatus}
                  size="sm"
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>

            {/* Price Update */}
            <div className="max-w-md">
              <Label htmlFor="newPrice" className="text-sm font-medium text-gray-700">
                Update Approximate Price
              </Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  placeholder="Enter price"
                />
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending || !newPrice}
                  size="sm"
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-admin-slate">Order Details</h4>
            {orderDetails.orderDetails && orderDetails.orderDetails.length > 0 ? (
              <div className="space-y-3">
                {orderDetails.orderDetails.map((detail: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{detail.field_name}</div>
                        <div className="text-sm text-gray-600">{detail.field_value}</div>
                      </div>
                      {detail.field_type && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {detail.field_type}
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
      </DialogContent>
    </Dialog>
  );
}