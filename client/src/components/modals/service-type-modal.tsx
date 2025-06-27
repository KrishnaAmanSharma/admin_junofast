import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabaseStorage } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceTypeSchema } from "@shared/schema";
import type { ServiceType, InsertServiceType } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

interface ServiceTypeModalProps {
  serviceType: ServiceType | null;
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertServiceTypeSchema.extend({
  isActive: z.boolean().default(true),
});

export function ServiceTypeModal({ serviceType, isOpen, onClose }: ServiceTypeModalProps) {
  const { toast } = useToast();
  const isEditing = !!serviceType;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: serviceType?.name || "",
      description: serviceType?.description || "",
      imageUrl: serviceType?.imageUrl || "",
      isActive: serviceType?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertServiceType) => {
      if (isEditing) {
        return await supabaseStorage.updateServiceType(serviceType.id, data);
      } else {
        return await supabaseStorage.createServiceType(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-types"] });
      toast({
        title: "Success",
        description: `Service type ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} service type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: serviceType?.name || "",
        description: serviceType?.description || "",
        imageUrl: serviceType?.imageUrl || "",
        isActive: serviceType?.isActive ?? true,
      });
    }
  }, [serviceType, isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service Type" : "Add Service Type"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., House Relocation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the service type..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-gray-500">
                      Enable this service type for customers
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-primary-custom hover:bg-blue-700"
              >
                {mutation.isPending 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update" : "Create")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
