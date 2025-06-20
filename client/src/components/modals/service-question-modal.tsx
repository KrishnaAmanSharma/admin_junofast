import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabaseStorage } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceQuestionSchema } from "@shared/schema";
import type { ServiceQuestion, InsertServiceQuestion, ServiceType } from "@shared/schema";
import { z } from "zod";
import { Plus, X } from "lucide-react";

interface ServiceQuestionModalProps {
  question: ServiceQuestion | null;
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  serviceTypeId: z.string().min(1, "Service type is required"),
  question: z.string().min(1, "Question is required"),
  questionType: z.string().min(1, "Question type is required"),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  options: z.string().optional(),
});

const questionTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "dropdown", label: "Dropdown" },
  { value: "add_items", label: "Add Items" },
];

export function ServiceQuestionModal({ question, isOpen, onClose }: ServiceQuestionModalProps) {
  const { toast } = useToast();
  const isEditing = !!question;
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceTypeId: "",
      question: "",
      questionType: "text",
      isRequired: true,
      displayOrder: 0,
      isActive: true,
      options: "",
    },
  });

  // Reset form when question changes
  useEffect(() => {
    if (question) {
      // Convert stored options to dropdown options array
      let dropdownOptionsArray: string[] = [];
      
      if (question.options) {
        if (Array.isArray(question.options)) {
          // For dropdown, use the array directly
          dropdownOptionsArray = question.options as string[];
        } else if (typeof question.options === 'string') {
          // Handle legacy comma-separated string format
          dropdownOptionsArray = question.options.split(',').map((opt: string) => opt.trim()).filter(opt => opt.length > 0);
        }
      }
      
      setDropdownOptions(dropdownOptionsArray);
      form.reset({
        serviceTypeId: question.serviceTypeId || "",
        question: question.question || "",
        questionType: question.questionType || "text",
        isRequired: question.isRequired ?? true,
        displayOrder: question.displayOrder || 0,
        isActive: question.isActive ?? true,
        options: "",
      });
    } else {
      setDropdownOptions([]);
      form.reset({
        serviceTypeId: "",
        question: "",
        questionType: "text",
        isRequired: true,
        displayOrder: 0,
        isActive: true,
        options: "",
      });
    }
  }, [question, form]);

  const selectedQuestionType = form.watch("questionType");

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Process options based on question type
      let processedData: any = { ...data };
      
      // Set parentQuestionId to null since we removed this functionality
      processedData.parentQuestionId = null;
      
      if (data.questionType === "dropdown") {
        // For dropdown, use the dropdownOptions array
        processedData.options = dropdownOptions.length > 0 ? dropdownOptions : null;
      } else {
        processedData.options = null;
      }

      if (isEditing) {
        return await supabaseStorage.updateServiceQuestion(question.id, processedData);
      } else {
        return await supabaseStorage.createServiceQuestion(processedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-questions"] });
      toast({
        title: "Success",
        description: `Service question ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
      setDropdownOptions([]);
      setNewOption("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} service question`,
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
    setDropdownOptions([]);
    setNewOption("");
  };

  // Functions to manage dropdown options
  const addDropdownOption = () => {
    if (newOption.trim() && !dropdownOptions.includes(newOption.trim())) {
      setDropdownOptions([...dropdownOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeDropdownOption = (index: number) => {
    setDropdownOptions(dropdownOptions.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDropdownOption();
    }
  };

  const showOptionsField = selectedQuestionType === "dropdown";

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service Question" : "Add Service Question"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes?.map((serviceType) => (
                        <SelectItem key={serviceType.id} value={serviceType.id}>
                          {serviceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., How many rooms need to be packed?"
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
              name="questionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showOptionsField && (
              <div className="space-y-3">
                <FormLabel>Dropdown Options</FormLabel>
                
                {/* Add new option input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter option (e.g., Small 1-2 rooms)"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addDropdownOption}
                    disabled={!newOption.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Display current options */}
                {dropdownOptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Options:</p>
                    <div className="space-y-1">
                      {dropdownOptions.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                        >
                          <span className="text-sm">{option}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDropdownOption(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dropdownOptions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Add dropdown options for users to choose from
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Required</FormLabel>
                    <div className="text-sm text-gray-500">
                      Make this question mandatory
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <div className="text-sm text-gray-500">
                      Show this question to users
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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}