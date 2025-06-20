import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ServiceTypeModal } from "@/components/modals/service-type-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabaseStorage } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { ServiceType } from "@shared/schema";

export default function ServiceTypes() {
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: serviceTypes, isLoading } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabaseStorage.deleteServiceType(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-types"] });
      toast({
        title: "Success",
        description: "Service type deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete service type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedServiceType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this service type?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Service Types" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Service Types" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-admin-slate">Service Types</h2>
          <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Service Type
          </Button>
        </div>

        {!serviceTypes || serviceTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No service types found</p>
            <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create your first service type
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTypes.map((serviceType) => (
              <div key={serviceType.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <img 
                  src={serviceType.imageUrl} 
                  alt={serviceType.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
                  }}
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-admin-slate mb-2">{serviceType.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{serviceType.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      serviceType.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {serviceType.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(serviceType)}
                        className="text-primary-custom hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(serviceType.id)}
                        className="text-destructive-custom hover:text-red-700"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ServiceTypeModal
        serviceType={selectedServiceType}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedServiceType(null);
        }}
      />
    </div>
  );
}
