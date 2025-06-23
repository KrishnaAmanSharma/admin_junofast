import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  Check, 
  X, 
  Search, 
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  Clock,
  DollarSign,
  User
} from "lucide-react";

interface Vendor {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  business_name: string;
  service_types: string[];
  city: string;
  address: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  total_orders: number;
  completed_orders: number;
  total_earnings: number;
  is_online: boolean;
  last_active_at: string | null;
  created_at: string;
  approved_at: string | null;
  business_license: string | null;
  insurance_info: string | null;
  profile_image_url: string | null;
}

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["/api/vendors/admin"],
    queryFn: async () => {
      const response = await fetch("/api/vendors/admin");
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    }
  });

  // Approve/reject vendor mutation
  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, action, reason }: { vendorId: string; action: 'approve' | 'reject'; reason?: string }) => {
      return apiRequest("POST", `/api/vendors/${vendorId}/status`, {
        action,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/admin"] });
      toast({
        title: "Success",
        description: "Vendor status updated successfully",
      });
      setSelectedVendor(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    }
  });

  // Filter vendors based on search and tab
  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || vendor.status === 
      (activeTab === "pending" ? "pending_approval" : activeTab);
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApprove = (vendor: Vendor) => {
    approveVendorMutation.mutate({
      vendorId: vendor.id,
      action: 'approve'
    });
  };

  const handleReject = (vendor: Vendor) => {
    approveVendorMutation.mutate({
      vendorId: vendor.id,
      action: 'reject',
      reason: 'Application rejected by admin'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-admin-slate">Vendor Management</h1>
        <p className="text-gray-600 mt-2">Manage vendor applications and monitor performance</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({vendors.filter((v: Vendor) => v.status === 'pending_approval').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({vendors.filter((v: Vendor) => v.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({vendors.filter((v: Vendor) => v.status === 'rejected').length})</TabsTrigger>
          <TabsTrigger value="all">All Vendors ({vendors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredVendors.map((vendor: Vendor) => (
              <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-admin-slate">{vendor.business_name}</h3>
                          <p className="text-sm text-gray-600">{vendor.full_name}</p>
                        </div>
                        <Badge className={getStatusColor(vendor.status)}>
                          {vendor.status.replace('_', ' ')}
                        </Badge>
                        {vendor.is_online && (
                          <Badge className="bg-green-500 text-white">Online</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {vendor.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {vendor.phone_number}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {vendor.city}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="h-4 w-4" />
                          {vendor.rating.toFixed(1)} ({vendor.total_orders} orders)
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {vendor.service_types.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>

                      {vendor.status === 'approved' && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-admin-slate">{vendor.completed_orders}</div>
                            <div className="text-gray-600">Completed</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-admin-slate">₹{vendor.total_earnings.toLocaleString()}</div>
                            <div className="text-gray-600">Earnings</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-admin-slate">
                              {vendor.last_active_at ? new Date(vendor.last_active_at).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="text-gray-600">Last Active</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVendor(vendor)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {vendor.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(vendor)}
                            disabled={approveVendorMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(vendor)}
                            disabled={approveVendorMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-600">
                  {searchTerm ? "Try adjusting your search terms" : "No vendors match the current filter"}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vendor Details - {selectedVendor.business_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Header with status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedVendor.business_name}</h3>
                    <p className="text-gray-600">{selectedVendor.full_name}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedVendor.status)}>
                  {selectedVendor.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedVendor.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{selectedVendor.phone_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <p className="text-sm text-gray-900">{selectedVendor.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedVendor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <p className="text-sm text-gray-900">{selectedVendor.address}</p>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.service_types.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Performance Metrics (if approved) */}
              {selectedVendor.status === 'approved' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedVendor.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedVendor.completed_orders}</div>
                    <div className="text-sm text-gray-600">Completed Orders</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">₹{selectedVendor.total_earnings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedVendor.status === 'pending_approval' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => handleApprove(selectedVendor)}
                    disabled={approveVendorMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Vendor
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
                    onClick={() => handleReject(selectedVendor)}
                    disabled={approveVendorMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}