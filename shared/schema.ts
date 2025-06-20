import { pgTable, text, uuid, boolean, timestamp, numeric, integer, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Service Types
export const serviceTypes = pgTable("service_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Profiles (linked to Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id),
  serviceType: text("service_type").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupPincode: text("pickup_pincode").notNull(),
  pickupLatitude: doublePrecision("pickup_latitude"),
  pickupLongitude: doublePrecision("pickup_longitude"),
  dropAddress: text("drop_address").notNull(),
  dropPincode: text("drop_pincode").notNull(),
  status: text("status").default("Pending"),
  approxPrice: numeric("approx_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Common Items
export const commonItems = pgTable("common_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceTypeId: uuid("service_type_id").references(() => serviceTypes.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Service Questions
export const serviceQuestions = pgTable("service_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceTypeId: uuid("service_type_id").notNull().references(() => serviceTypes.id),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(),
  isRequired: boolean("is_required").default(true),
  displayOrder: integer("display_order").default(0),
  options: jsonb("options"),
  parentQuestionId: uuid("parent_question_id").references(() => serviceQuestions.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Common Items in Orders
export const commonItemsInOrders = pgTable("common_items_in_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  itemId: uuid("item_id").references(() => commonItems.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Custom Items
export const customItems = pgTable("custom_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Order Question Answers
export const orderQuestionAnswers = pgTable("order_question_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  questionId: uuid("question_id").notNull().references(() => serviceQuestions.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  questionType: text("question_type").notNull(),
  parentQuestionId: uuid("parent_question_id").references(() => serviceQuestions.id),
  additionalData: jsonb("additional_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Item Photos
export const itemPhotos = pgTable("item_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  customItemId: uuid("custom_item_id").references(() => customItems.id),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Order Details
export const orderDetails = pgTable("order_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  name: text("name").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Schemas
export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommonItemSchema = createInsertSchema(commonItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceQuestionSchema = createInsertSchema(serviceQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOrderSchema = createInsertSchema(orders).pick({
  status: true,
  approxPrice: true,
}).extend({
  id: z.string(),
});

// Types
export type ServiceType = typeof serviceTypes.$inferSelect;
export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;

export type Profile = typeof profiles.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;

export type CommonItem = typeof commonItems.$inferSelect;
export type InsertCommonItem = z.infer<typeof insertCommonItemSchema>;

export type ServiceQuestion = typeof serviceQuestions.$inferSelect;
export type InsertServiceQuestion = z.infer<typeof insertServiceQuestionSchema>;

export type CommonItemInOrder = typeof commonItemsInOrders.$inferSelect;
export type CustomItem = typeof customItems.$inferSelect;
export type OrderQuestionAnswer = typeof orderQuestionAnswers.$inferSelect;
