import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { X } from "lucide-react";

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [newPrice, setNewPrice] = useState("");
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

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: string }) => {
      await apiRequest("PUT", `/api/orders/${id}`, {
        approxPrice: price,
        status: "Price Updated",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Success",
        description: "Order price updated successfully",
      });
      setNewPrice("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order price",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePrice = () => {
    if (!newPrice || !orderId) return;
    
    updatePriceMutation.mutate({
      id: orderId,
      price: newPrice,
    });
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
              Order Details - #{orderId.slice(0, 8)}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                    <span>{orderDetails?.profile?.fullName || "Unknown"}</span>
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
                    <span className="font-medium">Created:</span>{" "}
                    <span>
                      {orderDetails?.order?.createdAt 
                        ? new Date(orderDetails.order.createdAt).toLocaleDateString()
                        : "Unknown"
                      }
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Pickup Address</h4>
                <p className="text-sm text-gray-600">
                  {orderDetails?.order?.pickupAddress || "Not provided"}<br />
                  Pincode: {orderDetails?.order?.pickupPincode || "Not provided"}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-admin-slate mb-3">Drop Address</h4>
                <p className="text-sm text-gray-600">
                  {orderDetails?.order?.dropAddress || "Not provided"}<br />
                  Pincode: {orderDetails?.order?.dropPincode || "Not provided"}
                </p>
              </div>
            </div>

            {/* Common Items */}
            {orderDetails?.commonItems && orderDetails.commonItems.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-admin-slate mb-3">Common Items</h4>
                  <div className="space-y-2">
                    {orderDetails.commonItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={item.imageUrl || ""} 
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
                </div>
              </>
            )}

            {/* Custom Items */}
            {orderDetails?.customItems && orderDetails.customItems.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-admin-slate mb-3">Custom Items</h4>
                  <div className="space-y-2">
                    {orderDetails?.customItems?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-admin-slate">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <p className="font-medium">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Question Answers */}
            {orderDetails?.questionAnswers && orderDetails.questionAnswers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-admin-slate mb-3">Service Questions</h4>
                  <div className="space-y-3">
                    {orderDetails?.questionAnswers?.map((qa: any) => (
                      <div key={qa.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-admin-slate mb-1">{qa.question}</p>
                        <p className="text-sm text-gray-600">
                          <Badge variant="outline" className="mr-2">
                            {qa.questionType}
                          </Badge>
                          {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Price Update Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-admin-slate mb-3">Update Price</h4>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="newPrice" className="text-sm font-medium">
                    New Price (₹)
                  </Label>
                  <Input
                    id="newPrice"
                    type="number"
                    placeholder="Enter new price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleUpdatePrice}
                    disabled={!newPrice || updatePriceMutation.isPending}
                    className="bg-primary-custom hover:bg-blue-700"
                  >
                    {updatePriceMutation.isPending ? "Updating..." : "Update Price"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
