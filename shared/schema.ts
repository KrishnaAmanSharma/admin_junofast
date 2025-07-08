import { z } from "zod";

// Base Types
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string | null;
  vendorId?: string | null;
  serviceType: string;
  status: string;
  pickupAddress: string;
  pickupPincode: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  dropAddress: string;
  dropPincode: string;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  notes?: string | null;
  approxPrice: number | null;
  customerPrice?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommonItem {
  id: string;
  serviceTypeId: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceQuestion {
  id: string;
  serviceTypeId: string;
  question: string;
  questionType: string;
  isRequired: boolean;
  displayOrder: number;
  options: any[] | null;
  parentQuestionId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommonItemInOrder {
  id: string;
  orderId: string;
  itemId: string;
  name: string;
  quantity: number;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CustomItem {
  id: string;
  orderId: string;
  name: string;
  description: string | null;
  quantity: number;
  createdAt: string;
  photos?: ItemPhoto[];
}

export interface OrderQuestionAnswer {
  id: string;
  orderId: string;
  questionId: string;
  question: string;
  answer: string;
  questionType: string;
  parentQuestionId: string | null;
  additionalData: any | null;
  createdAt: string;
}

export interface ItemPhoto {
  id: string;
  customItemId: string;
  photoUrl: string;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderId: string;
  name: string;
  value: string;
  createdAt: string;
}

// Vendor Types
export interface VendorProfile {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  serviceTypes: string[];
  rating: number;
  isOnline: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface VendorResponse {
  id: string;
  orderId: string;
  vendorId: string;
  responseType: 'accept' | 'reject' | 'price_update';
  proposedPrice?: number;
  message?: string;
  adminApproved?: boolean;
  adminResponse?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface OrderBroadcast {
  id: string;
  orderId: string;
  vendorId: string;
  broadcastAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  responseAt?: string;
  expiresAt: string;
}

// Payment Types
export interface OrderPayment {
  id: string;
  orderId: string;
  vendorId: string;
  totalDue: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPaymentTransaction {
  id: string;
  paymentId: string;
  amount: number;
  transactionType: 'payment' | 'refund';
  notes?: string;
  createdAt: string;
}

// Validation Schemas
export const insertServiceTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL"),
  isActive: z.boolean().default(true),
});

export const insertCommonItemSchema = z.object({
  serviceTypeId: z.string().uuid("Must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL"),
  isActive: z.boolean().default(true),
});

export const insertServiceQuestionSchema = z.object({
  serviceTypeId: z.string().uuid("Must be a valid UUID"),
  question: z.string().min(1, "Question is required"),
  questionType: z.enum(["text", "select", "multiselect", "number", "date"]),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  options: z.array(z.string()).optional(),
  parentQuestionId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

export const updateOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Pending", "Broadcasted", "Confirmed", "Price Accepted", "In Progress", "Completed", "Cancelled"]).optional(),
  approxPrice: z.number().positive().optional(),
  finalPrice: z.number().positive().optional(),
  estimatedPrice: z.number().positive().optional(),
  notes: z.string().optional(),
  vendorId: z.string().uuid().optional(),
});

// Type exports for backward compatibility
export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type InsertCommonItem = z.infer<typeof insertCommonItemSchema>;
export type InsertServiceQuestion = z.infer<typeof insertServiceQuestionSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
