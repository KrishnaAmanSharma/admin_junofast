import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ServiceQuestionModal } from "@/components/modals/service-question-modal";
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
import type { ServiceQuestion, ServiceType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ServiceQuestions() {
  const [selectedQuestion, setSelectedQuestion] = useState<ServiceQuestion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    serviceTypeId: "all",
    questionType: "all",
  });
  const { toast } = useToast();
  const [selectedInfo, setSelectedInfo] = useState(false);

  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });

  const { data: serviceQuestions, isLoading } = useQuery<ServiceQuestion[]>({
    queryKey: ["/api/service-questions", filters.serviceTypeId],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabaseStorage.deleteServiceQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-questions"] });
      toast({
        title: "Success",
        description: "Service question deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete service question: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setSelectedQuestion(null);
    setIsModalOpen(true);
  };

  const handleEdit = (question: ServiceQuestion) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteMutation.mutate(id);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    const typeColors = {
      "text": "bg-blue-100 text-blue-800",
      "number": "bg-green-100 text-green-800",
      "date": "bg-purple-100 text-purple-800",
      "boolean": "bg-pink-100 text-pink-800",
      "dropdown": "bg-orange-100 text-orange-800",
      "add_items": "bg-cyan-100 text-cyan-800",
      "sub_questions": "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge 
        variant="secondary" 
        className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}
      >
        {type}
      </Badge>
    );
  };

  const filteredQuestions = serviceQuestions?.filter(question => {
    if (filters.questionType && filters.questionType !== "all" && question.questionType !== filters.questionType) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <Header title="Service Questions" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-admin-slate">Service Questions</h2>
            <Button variant="ghost" size="icon" className="p-0 h-5 w-5 text-gray-400 hover:text-blue-600" onClick={() => setSelectedInfo(true)}>
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
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
                <Label htmlFor="questionType" className="text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </Label>
                <Select 
                  value={filters.questionType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, questionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="add_items">Add Items</SelectItem>
                    <SelectItem value="sub_questions">Sub Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="w-full bg-primary-custom hover:bg-blue-700"
                  onClick={() => {
                    // Filters are applied automatically via state
                  }}
                >
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-admin-slate mb-4">Questions Management</h3>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse border-b border-gray-100 pb-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredQuestions || filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No service questions found</p>
                <Button onClick={handleAdd} className="bg-primary-custom hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first question
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Question</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Service Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Required</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Order</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((question) => {
                      const serviceType = serviceTypes?.find(st => st.id === question.serviceTypeId);
                      
                      return (
                        <tr key={question.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 text-admin-slate max-w-xs truncate">
                            {question.question}
                          </td>
                          <td className="py-4 px-6 text-admin-slate">
                            {serviceType?.name || "Unknown"}
                          </td>
                          <td className="py-4 px-6">
                            {getQuestionTypeBadge(question.questionType)}
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant={question.isRequired ? "default" : "secondary"}>
                              {question.isRequired ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-admin-slate">{question.displayOrder}</td>
                          <td className="py-4 px-6">
                            <Badge variant={question.isActive ? "default" : "secondary"}>
                              {question.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(question)}
                                className="text-primary-custom hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(question.id)}
                                className="text-destructive-custom hover:text-red-700"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ServiceQuestionModal
        question={selectedQuestion}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuestion(null);
        }}
      />

      {/* Info Dialog */}
      <Dialog open={selectedInfo} onOpenChange={() => setSelectedInfo(false)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Questions - Complete Guide</DialogTitle>
            <DialogDescription>
              <b>What are Service Questions?</b><br/>
              Service questions are customizable questions you ask users or vendors as part of your service workflow. They help you collect all the information needed to process an order, configure a service, or understand customer needs.<br/><br/>
              <b>Why use Service Questions?</b><br/>
              - Ensure you have all the details to deliver the right service<br/>
              - Standardize data collection for reporting and automation<br/>
              - Guide users through complex processes step by step<br/><br/>
              <b>When to use Service Questions?</b><br/>
              - When onboarding new customers or vendors<br/>
              - When a service requires specific details (e.g., move date, item list, preferences)<br/>
              - When you want to automate or validate order intake<br/><br/>
              <b>How to create and manage Service Questions:</b>
              <ul className="list-disc ml-6">
                <li>Click "Add Question" to create a new question for a service type</li>
                <li>Choose the question type (text, number, date, boolean, dropdown, add items, sub questions)</li>
                <li>Set if the question is required or optional</li>
                <li>Use display order to control the sequence</li>
                <li>Edit or delete questions as your process evolves</li>
              </ul>
              <br/>
              <b>Logic for Question Types:</b>
              <ul className="list-disc ml-6">
                <li><b>Text:</b> Freeform answer (e.g., address, comments)</li>
                <li><b>Number:</b> Numeric input (e.g., quantity, age)</li>
                <li><b>Date:</b> Date picker (e.g., move date)</li>
                <li><b>Boolean:</b> Yes/No or True/False (e.g., is urgent?)</li>
                <li><b>Dropdown:</b> Select from predefined options</li>
                <li><b>Add Items:</b> Lets user add multiple items (e.g., inventory list)</li>
                <li><b>Sub Questions:</b> Conditional follow-up questions based on previous answers</li>
              </ul>
              <br/>
              <b>Best Practices:</b>
              <ul className="list-disc ml-6">
                <li>Keep questions clear and concise</li>
                <li>Use required only for truly essential info</li>
                <li>Group related questions for better UX</li>
                <li>Test your questions with real users</li>
                <li>Review and update questions as your business evolves</li>
              </ul>
              <br/>
              <b>Example Scenarios:</b>
              <ul className="list-disc ml-6">
                <li>For a house move: "What is your move date?" (date), "How many boxes?" (number), "Do you need packing help?" (boolean)</li>
                <li>For a cleaning service: "What type of cleaning?" (dropdown), "Any pets at home?" (boolean)</li>
                <li>For a custom order: Use sub questions to ask for more details only if needed</li>
              </ul>
              <br/>
              <b>Advanced Logic:</b><br/>
              - Use sub questions to create dynamic, conditional flows<br/>
              - Use display order to control the sequence of questions<br/>
              - Use dropdowns for standardized answers and easier reporting<br/>
              <br/>
              <b>Why keep it updated?</b><br/>
              Your business, services, and customer needs change. Regularly review and improve your service questions to keep your workflow efficient and your data high quality.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
