import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CommonItemModal } from "@/components/modals/common-item-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabaseStorage } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, HelpCircle } from "lucide-react";
import type { CommonItem, ServiceType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function CommonItems() {
  const [selectedItem, setSelectedItem] = useState<CommonItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    serviceTypeId: "all",
    search: "",
  });
  const { toast } = useToast();
  const [selectedInfo, setSelectedInfo] = useState(false);

  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });

  const { data: commonItems, isLoading } = useQuery<CommonItem[]>({
    queryKey: ["/api/common-items", filters.serviceTypeId],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabaseStorage.deleteCommonItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/common-items"] });
      toast({
        title: "Success",
        description: "Common item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete common item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CommonItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredItems = commonItems?.filter(item => {
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <Header title="Common Items" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-admin-slate">Common Items</h2>
            <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-blue-600" onClick={() => setSelectedInfo(true)}>
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serviceType" className="text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </Label>
                <Select 
                  value={filters.serviceTypeId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, serviceTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Service Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Service Types</SelectItem>
                    {serviceTypes?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2">
                  Search Items
                </Label>
                <Input
                  id="search"
                  placeholder="Search by item name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="w-full bg-primary-custom hover:bg-blue-700"
                  onClick={() => {
                    // Filters are applied automatically via state
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
                <div className="w-full h-32 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="flex space-x-1">
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !filteredItems || filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No common items found</p>
            <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add your first common item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const serviceType = serviceTypes?.find(st => st.id === item.serviceTypeId);
              
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <img 
                    src={item.imageUrl || "https://images.unsplash.com/photo-1573376670774-4427757f7963?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ym94fGVufDB8fDB8fHww"} 
                    alt={item.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1573376670774-4427757f7963?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ym94fGVufDB8fDB8fHww";
                    }}
                  />
                  <div className="p-4">
                    <h4 className="font-medium text-admin-slate mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {serviceType?.name || "Unknown Service"}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="text-primary-custom hover:text-blue-700 h-6 w-6"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive-custom hover:text-red-700 h-6 w-6"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CommonItemModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Info Dialog */}
      <Dialog open={selectedInfo} onOpenChange={() => setSelectedInfo(false)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Common Items - Complete Guide</DialogTitle>
            <DialogDescription>
              <b>What are Common Items?</b><br/>
              Common items are frequently used or standard items associated with a service type (e.g., boxes, furniture, appliances for relocation). They help you quickly build orders, quotes, or checklists by selecting from a predefined list.<br/><br/>
              <b>Why use Common Items?</b><br/>
              - Save time by reusing standard items<br/>
              - Ensure consistency in orders and inventory<br/>
              - Make it easier for users to select or add items<br/><br/>
              <b>When to use Common Items?</b><br/>
              - When creating or editing orders that involve physical goods or repeatable services<br/>
              - When you want to standardize item names, images, and descriptions<br/>
              - When you want to provide a quick-pick list for users or staff<br/><br/>
              <b>How to create and manage Common Items:</b>
              <ul className="list-disc ml-6">
                <li>Click "Add Item" to create a new common item for a service type</li>
                <li>Fill in the name, description, and (optionally) an image URL</li>
                <li>Assign the item to a service type for better organization</li>
                <li>Set the item as active or inactive as needed</li>
                <li>Edit or delete items as your offerings change</li>
              </ul>
              <br/>
              <b>Logic for Fields:</b>
              <ul className="list-disc ml-6">
                <li><b>Name:</b> The display name of the item (e.g., "Large Box")</li>
                <li><b>Description:</b> Short details about the item (e.g., "Double-walled, 24x18x18 inches")</li>
                <li><b>Image URL:</b> Optional image to help users recognize the item. If not provided, a default image is shown.</li>
                <li><b>Service Type:</b> The category or service this item belongs to (e.g., "House Relocation")</li>
                <li><b>Status:</b> Active items are available for selection; inactive items are hidden</li>
              </ul>
              <br/>
              <b>Best Practices:</b>
              <ul className="list-disc ml-6">
                <li>Use clear, descriptive names and images</li>
                <li>Keep descriptions concise but informative</li>
                <li>Regularly review and update your item list</li>
                <li>Deactivate (rather than delete) items you no longer use</li>
                <li>Group items by service type for easier selection</li>
              </ul>
              <br/>
              <b>Example Scenarios:</b>
              <ul className="list-disc ml-6">
                <li>For a moving company: "Large Box", "Wardrobe Box", "Sofa", "Refrigerator"</li>
                <li>For a cleaning service: "Vacuum Cleaner", "Mop", "Cleaning Solution"</li>
                <li>For an event planner: "Round Table", "Folding Chair", "Stage Light"</li>
              </ul>
              <br/>
              <b>Advanced Tips:</b><br/>
              - Use images to help users quickly identify items<br/>
              - Use the search and filter options to find items fast<br/>
              - Keep your list focused on the most commonly used items for efficiency<br/>
              <br/>
              <b>Why keep it updated?</b><br/>
              Your business, services, and inventory change over time. Regularly review and improve your common items to keep your workflow efficient and your data high quality.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
