import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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
import { useState } from "react";

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
  { value: "sub_questions", label: "Sub Questions" },
];

export function ServiceQuestionModal({ question, isOpen, onClose }: ServiceQuestionModalProps) {
  const { toast } = useToast();
  const isEditing = !!question;
  const [optionsText, setOptionsText] = useState(
    question?.options ? JSON.stringify(question.options, null, 2) : ""
  );

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
      // Convert stored options back to line-by-line format for editing
      let newOptionsText = "";
      if (question.options) {
        if (typeof question.options === 'string') {
          // If it's already a comma-separated string, convert to lines
          newOptionsText = question.options.split(',').join('\n');
        } else if (Array.isArray(question.options)) {
          // Handle legacy array format
          if (question.questionType === "sub_questions") {
            newOptionsText = question.options.map((opt: any) => opt.question || opt).join('\n');
          } else {
            newOptionsText = question.options.join('\n');
          }
        }
      }
      setOptionsText(newOptionsText);
      form.reset({
        serviceTypeId: question.serviceTypeId || "",
        question: question.question || "",
        questionType: question.questionType || "text",
        isRequired: question.isRequired ?? true,
        displayOrder: question.displayOrder || 0,
        isActive: question.isActive ?? true,
        options: newOptionsText,
      });
    } else {
      setOptionsText("");
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
      
      if (data.questionType === "dropdown" || data.questionType === "sub_questions") {
        if (data.options && data.options.trim()) {
          // Always store as simple string for Flutter compatibility
          // Convert line-by-line input to comma-separated string
          const lines = data.options.split('\n').filter((line: string) => line.trim());
          processedData.options = lines.join(',');
        } else {
          processedData.options = null;
        }
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
      setOptionsText("");
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
    setOptionsText("");
  };

  const showOptionsField = selectedQuestionType === "dropdown" || selectedQuestionType === "sub_questions";

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
              <FormField
                control={form.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>
                        {selectedQuestionType === "dropdown" ? "Dropdown Options" : "Sub Questions"}
                      </FormLabel>
                      <div className="group relative">
                        <Button type="button" variant="outline" size="sm" className="h-6 w-6 p-0">
                          <span className="text-xs">?</span>
                        </Button>
                        <div className="absolute left-0 top-8 z-50 hidden group-hover:block w-80 p-3 bg-white border rounded-lg shadow-lg">
                          <h4 className="font-medium mb-2">
                            {selectedQuestionType === "dropdown" ? "How to add dropdown options:" : "How to add sub questions:"}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-2">
                            {selectedQuestionType === "dropdown" ? (
                              <>
                                <p><strong>Simple way:</strong> Write one option per line</p>
                                <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                                  Small (1-2 rooms)<br/>
                                  Medium (3-4 rooms)<br/>
                                  Large (5+ rooms)
                                </div>
                                <p><strong>Advanced:</strong> Use JSON format</p>
                                <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                                  ["Small (1-2 rooms)", "Medium (3-4 rooms)", "Large (5+ rooms)"]
                                </div>
                              </>
                            ) : (
                              <>
                                <p><strong>Simple way:</strong> Write one question per line</p>
                                <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                                  How many bedrooms?<br/>
                                  How many bathrooms?<br/>
                                  Any fragile items?
                                </div>
                                <p><strong>Advanced:</strong> Use JSON format</p>
                                <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                                  [{`{"question": "How many bedrooms?"}`}, {`{"question": "How many bathrooms?"}`}]
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder={selectedQuestionType === "dropdown" 
                          ? "Small (1-2 rooms)\nMedium (3-4 rooms)\nLarge (5+ rooms)"
                          : "How many bedrooms?\nHow many bathrooms?\nAny fragile items?"
                        }
                        className="min-h-[120px]"
                        {...field}
                        value={optionsText}
                        onChange={(e) => {
                          setOptionsText(e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500">
                      {selectedQuestionType === "dropdown" 
                        ? "Tip: Write one option per line (Simple) or use JSON format (Advanced)"
                        : "Tip: Write one question per line (Simple) or use JSON format (Advanced)"
                      }
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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