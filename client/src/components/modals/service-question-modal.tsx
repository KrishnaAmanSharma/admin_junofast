import { useMutation, useQuery } from "@tanstack/react-query";
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

const formSchema = insertServiceQuestionSchema.extend({
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
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

  const { data: parentQuestions } = useQuery<ServiceQuestion[]>({
    queryKey: ["/api/service-questions"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceTypeId: question?.serviceTypeId || "",
      question: question?.question || "",
      questionType: question?.questionType || "text",
      isRequired: question?.isRequired ?? true,
      displayOrder: question?.displayOrder || 0,
      parentQuestionId: question?.parentQuestionId || undefined,
      isActive: question?.isActive ?? true,
      options: optionsText,
    },
  });

  const selectedQuestionType = form.watch("questionType");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Parse options if provided and question type supports it
      let processedData = { ...data };
      if (data.options && (data.questionType === "dropdown" || data.questionType === "sub_questions")) {
        try {
          processedData.options = JSON.parse(data.options);
        } catch (error) {
          throw new Error("Invalid JSON format in options field");
        }
      } else {
        processedData.options = null;
      }

      // Remove the options string field before sending
      delete processedData.options;
      if (data.options && (data.questionType === "dropdown" || data.questionType === "sub_questions")) {
        processedData.options = JSON.parse(data.options);
      }

      if (isEditing) {
        await apiRequest("PUT", `/api/service-questions/${question.id}`, processedData);
      } else {
        await apiRequest("POST", "/api/service-questions", processedData);
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>
                      Options {selectedQuestionType === "dropdown" ? "(for dropdown)" : "(JSON format)"}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={selectedQuestionType === "dropdown" 
                          ? '["Option 1", "Option 2", "Option 3"]'
                          : '{"key": "value"}'
                        }
                        className="min-h-[100px] font-mono text-sm"
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
                        ? "Enter options as JSON array, e.g., [\"Option 1\", \"Option 2\"]"
                        : "Enter options as valid JSON object"
                      }
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="parentQuestionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Question (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent question" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No parent question</SelectItem>
                      {parentQuestions?.filter(q => q.id !== question?.id).map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.question.length > 50 ? `${q.question.substring(0, 50)}...` : q.question}
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
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-gray-500">
                      Enable this question for customers
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
