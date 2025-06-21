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
                    <span>{formatCurrency(orderDetails?.order?.approxPrice)}</span>
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
