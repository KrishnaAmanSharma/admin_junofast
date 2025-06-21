import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, asc, like, and, count, sum } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  ServiceType,
  InsertServiceType,
  Profile,
  Order,
  UpdateOrder,
  CommonItem,
  InsertCommonItem,
  ServiceQuestion,
  InsertServiceQuestion,
  CommonItemInOrder,
  CustomItem,
  OrderQuestionAnswer,
} from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

let db: any;
let useRealDatabase = false;

try {
  const client = postgres(DATABASE_URL, {
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    ssl: 'require',
  });
  
  db = drizzle(client, { schema });
  useRealDatabase = true;
  console.log("Connected to Supabase database successfully");
} catch (error) {
  console.warn("Database connection failed, using mock data:", error);
  useRealDatabase = false;
}

export interface IStorage {
  // Service Types
  getServiceTypes(): Promise<ServiceType[]>;
  getServiceType(id: string): Promise<ServiceType | undefined>;
  createServiceType(serviceType: InsertServiceType): Promise<ServiceType>;
  updateServiceType(id: string, serviceType: Partial<InsertServiceType>): Promise<ServiceType>;
  deleteServiceType(id: string): Promise<void>;

  // Common Items
  getCommonItems(serviceTypeId?: string): Promise<CommonItem[]>;
  getCommonItem(id: string): Promise<CommonItem | undefined>;
  createCommonItem(item: InsertCommonItem): Promise<CommonItem>;
  updateCommonItem(id: string, item: Partial<InsertCommonItem>): Promise<CommonItem>;
  deleteCommonItem(id: string): Promise<void>;

  // Service Questions
  getServiceQuestions(serviceTypeId?: string): Promise<ServiceQuestion[]>;
  getServiceQuestion(id: string): Promise<ServiceQuestion | undefined>;
  createServiceQuestion(question: InsertServiceQuestion): Promise<ServiceQuestion>;
  updateServiceQuestion(id: string, question: Partial<InsertServiceQuestion>): Promise<ServiceQuestion>;
  deleteServiceQuestion(id: string): Promise<void>;

  // Orders
  getOrders(filters?: { status?: string; serviceType?: string; limit?: number }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrder(id: string, updates: Partial<UpdateOrder>): Promise<Order>;
  getOrderDetails(id: string): Promise<{
    order: Order;
    profile: Profile | null;
    commonItems: CommonItemInOrder[];
    customItems: CustomItem[];
    questionAnswers: OrderQuestionAnswer[];
    orderDetails: any[];
  }>;

  // Users
  getProfiles(search?: string): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | undefined>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile>;

  // Dashboard Metrics
  getDashboardMetrics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
    newUsers: number;
  }>;

  // Recent Orders for Dashboard
  getRecentOrdersRequiringAttention(): Promise<Array<Order & { profile: Profile | null }>>;
}

export class PostgresStorage implements IStorage {
  async getServiceTypes(): Promise<ServiceType[]> {
    return await db.select().from(schema.serviceTypes).orderBy(asc(schema.serviceTypes.name));
  }

  async getServiceType(id: string): Promise<ServiceType | undefined> {
    const result = await db.select().from(schema.serviceTypes).where(eq(schema.serviceTypes.id, id));
    return result[0];
  }

  async createServiceType(serviceType: InsertServiceType): Promise<ServiceType> {
    const result = await db.insert(schema.serviceTypes).values({
      ...serviceType,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateServiceType(id: string, serviceType: Partial<InsertServiceType>): Promise<ServiceType> {
    const result = await db.update(schema.serviceTypes)
      .set({ ...serviceType, updatedAt: new Date() })
      .where(eq(schema.serviceTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteServiceType(id: string): Promise<void> {
    await db.delete(schema.serviceTypes).where(eq(schema.serviceTypes.id, id));
  }

  async getCommonItems(serviceTypeId?: string): Promise<CommonItem[]> {
    const query = db.select().from(schema.commonItems);
    if (serviceTypeId) {
      return await query.where(eq(schema.commonItems.serviceTypeId, serviceTypeId));
    }
    return await query.orderBy(asc(schema.commonItems.name));
  }

  async getCommonItem(id: string): Promise<CommonItem | undefined> {
    const result = await db.select().from(schema.commonItems).where(eq(schema.commonItems.id, id));
    return result[0];
  }

  async createCommonItem(item: InsertCommonItem): Promise<CommonItem> {
    const result = await db.insert(schema.commonItems).values({
      ...item,
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateCommonItem(id: string, item: Partial<InsertCommonItem>): Promise<CommonItem> {
    const result = await db.update(schema.commonItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(schema.commonItems.id, id))
      .returning();
    return result[0];
  }

  async deleteCommonItem(id: string): Promise<void> {
    await db.delete(schema.commonItems).where(eq(schema.commonItems.id, id));
  }

  async getServiceQuestions(serviceTypeId?: string): Promise<ServiceQuestion[]> {
    const query = db.select().from(schema.serviceQuestions);
    let results;
    if (serviceTypeId) {
      results = await query.where(eq(schema.serviceQuestions.serviceTypeId, serviceTypeId))
        .orderBy(asc(schema.serviceQuestions.displayOrder));
    } else {
      results = await query.orderBy(asc(schema.serviceQuestions.displayOrder));
    }
    
    // Transform string options to arrays for Flutter compatibility
    return results.map(question => ({
      ...question,
      options: question.options && typeof question.options === 'string' 
        ? question.options.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0)
        : question.options
    }));
  }

  async getServiceQuestion(id: string): Promise<ServiceQuestion | undefined> {
    const result = await db.select().from(schema.serviceQuestions)
      .where(eq(schema.serviceQuestions.id, id));
    return result[0];
  }

  async createServiceQuestion(question: InsertServiceQuestion): Promise<ServiceQuestion> {
    const result = await db.insert(schema.serviceQuestions).values({
      ...question,
      updatedAt: new Date(),
    }).returning();
    
    // Transform string options to arrays for Flutter compatibility
    const created = result[0];
    return {
      ...created,
      options: created.options && typeof created.options === 'string' 
        ? created.options.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0)
        : created.options
    };
  }

  async updateServiceQuestion(id: string, question: Partial<InsertServiceQuestion>): Promise<ServiceQuestion> {
    const result = await db.update(schema.serviceQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(schema.serviceQuestions.id, id))
      .returning();
    
    // Transform string options to arrays for Flutter compatibility
    const updated = result[0];
    return {
      ...updated,
      options: updated.options && typeof updated.options === 'string' 
        ? updated.options.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0)
        : updated.options
    };
  }

  async deleteServiceQuestion(id: string): Promise<void> {
    await db.delete(schema.serviceQuestions).where(eq(schema.serviceQuestions.id, id));
  }

  async getOrders(filters?: { status?: string; serviceType?: string; limit?: number }): Promise<Order[]> {
    let baseQuery = db.select().from(schema.orders);
    
    const conditions = [];
    if (filters?.status && filters.status !== "All Status") {
      conditions.push(eq(schema.orders.status, filters.status));
    }
    if (filters?.serviceType && filters.serviceType !== "All Services") {
      conditions.push(eq(schema.orders.serviceType, filters.serviceType));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as any;
    }

    baseQuery = baseQuery.orderBy(desc(schema.orders.createdAt)) as any;

    if (filters?.limit) {
      baseQuery = baseQuery.limit(filters.limit) as any;
    }

    return await baseQuery;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async updateOrder(id: string, updates: Partial<UpdateOrder>): Promise<Order> {
    const result = await db.update(schema.orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  }

  async getOrderDetails(id: string): Promise<{
    order: Order;
    profile: Profile | null;
    commonItems: CommonItemInOrder[];
    customItems: CustomItem[];
    questionAnswers: OrderQuestionAnswer[];
    orderDetails: any[];
  }> {
    // Use Supabase client directly with the same nested query as Flutter app
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    try {
      // First, let's test if the order exists at all
      const { data: basicOrder, error: basicError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Basic order query error:', basicError);
      console.log('Basic order found:', !!basicOrder);

      if (basicError || !basicOrder) {
        throw new Error(`Order not found: ${basicError?.message}`);
      }

      // Now let's try each related table separately to see what exists
      const { data: orderDetailsData } = await supabase
        .from('order_details')
        .select('*')
        .eq('order_id', id);

      const { data: commonItemsData } = await supabase
        .from('common_items_in_orders')
        .select('*, common_items(*)')
        .eq('order_id', id);

      const { data: customItemsData } = await supabase
        .from('custom_items')
        .select('*, item_photos(*)')
        .eq('order_id', id);

      const { data: questionAnswersData } = await supabase
        .from('order_question_answers')
        .select('*')
        .eq('order_id', id);

      console.log('Separate queries results:');
      console.log('- Order details:', orderDetailsData?.length || 0, orderDetailsData);
      console.log('- Common items:', commonItemsData?.length || 0, commonItemsData);
      console.log('- Custom items:', customItemsData?.length || 0, customItemsData);
      console.log('- Question answers:', questionAnswersData?.length || 0, questionAnswersData);

      // Let's also check if ANY orders have related data
      const { data: anyOrderDetails } = await supabase
        .from('order_details')
        .select('*')
        .limit(5);
      
      const { data: anyCommonItems } = await supabase
        .from('common_items_in_orders')
        .select('*')
        .limit(5);

      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, service_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Database check - any order_details exist:', anyOrderDetails?.length || 0);
      console.log('Database check - any common_items_in_orders exist:', anyCommonItems?.length || 0);
      console.log('Recent orders in database:', allOrders?.map(o => ({ id: o.id.substring(0, 8), service: o.service_type })) || []);

      // Use basic order as orderData
      const orderData = basicOrder;

      // Process the data exactly like Flutter OrderModel.fromJson()
      const order = orderData as Order;

      // Get profile separately
      let profile = null;
      if (order.userId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', order.userId)
          .single();
        profile = profileData;
      }

      // Process common items using separate query results
      const commonItems: CommonItemInOrder[] = [];
      if (commonItemsData && Array.isArray(commonItemsData)) {
        for (const item of commonItemsData) {
          const commonItem = item.common_items; // This is the nested common_items data
          commonItems.push({
            id: item.id,
            orderId: item.order_id,
            itemId: item.item_id,
            name: item.name || (commonItem ? commonItem.name : ''),
            description: item.description || (commonItem ? commonItem.description : ''),
            imageUrl: item.image_url || (commonItem ? commonItem.image_url : ''),
            quantity: item.quantity || 0,
            createdAt: item.created_at,
          });
        }
      }

      // Process custom items using separate query results
      const customItems: CustomItem[] = [];
      if (customItemsData && Array.isArray(customItemsData)) {
        for (const item of customItemsData) {
          customItems.push({
            id: item.id,
            orderId: item.order_id,
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || 1,
            createdAt: item.created_at,
          });
        }
      }

      // Process question answers using separate query results
      const questionAnswers: OrderQuestionAnswer[] = [];
      if (questionAnswersData && Array.isArray(questionAnswersData)) {
        for (const answer of questionAnswersData) {
          questionAnswers.push({
            id: answer.id,
            orderId: answer.order_id,
            questionId: answer.question_id,
            question: answer.question,
            answer: answer.answer,
            questionType: answer.question_type,
            parentQuestionId: answer.parent_question_id,
            additionalData: answer.additional_data,
            createdAt: answer.created_at,
          });
        }
      }

      // Process order details using separate query results
      const orderDetails: any[] = [];
      if (orderDetailsData && Array.isArray(orderDetailsData)) {
        for (const detail of orderDetailsData) {
          orderDetails.push({
            id: detail.id,
            orderId: detail.order_id,
            name: detail.name,
            value: detail.value,
            createdAt: detail.created_at,
          });
        }
      }

      console.log(`Order ${id}: Found ${orderDetails.length} details, ${commonItems.length} common items, ${customItems.length} custom items, ${questionAnswers.length} answers`);

      return {
        order,
        profile,
        commonItems,
        customItems,
        questionAnswers,
        orderDetails,
      };
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  async getProfiles(search?: string): Promise<Profile[]> {
    let query = db.select().from(schema.profiles);
    
    if (search) {
      query = query.where(
        like(schema.profiles.fullName, `%${search}%`)
      );
    }

    return await query.orderBy(desc(schema.profiles.createdAt));
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
    return result[0];
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const result = await db.update(schema.profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.profiles.id, id))
      .returning();
    return result[0];
  }

  async getDashboardMetrics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
    newUsers: number;
  }> {
    const [totalOrdersResult] = await db.select({ count: count() }).from(schema.orders);
    
    const [totalRevenueResult] = await db.select({ 
      sum: sum(schema.orders.approxPrice) 
    }).from(schema.orders).where(eq(schema.orders.status, "Completed"));
    
    const [activeOrdersResult] = await db.select({ count: count() })
      .from(schema.orders)
      .where(and(
        eq(schema.orders.status, "In Progress"),
      ));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [newUsersResult] = await db.select({ count: count() })
      .from(schema.profiles)
      .where(and(
        // @ts-ignore
        schema.profiles.createdAt >= thirtyDaysAgo
      ));

    return {
      totalOrders: totalOrdersResult.count,
      totalRevenue: Number(totalRevenueResult.sum || 0),
      activeOrders: activeOrdersResult.count,
      newUsers: newUsersResult.count,
    };
  }

  async getRecentOrdersRequiringAttention(): Promise<Array<Order & { profile: Profile | null }>> {
    const orders = await db.select().from(schema.orders)
      .where(and(
        eq(schema.orders.status, "Pending"),
      ))
      .orderBy(desc(schema.orders.createdAt))
      .limit(5);

    const ordersWithProfiles = await Promise.all(
      orders.map(async (order) => {
        let profile = null;
        if (order.userId) {
          const profileResult = await db.select().from(schema.profiles)
            .where(eq(schema.profiles.id, order.userId));
          profile = profileResult[0] || null;
        }
        return { ...order, profile };
      })
    );

    return ordersWithProfiles;
  }
}

// Configure storage based on database connectivity
export const storage = useRealDatabase ? new PostgresStorage() : (() => {
  console.log("Using MockStorage as fallback");
  const { MockStorage } = require("./mock-storage");
  return new MockStorage();
})();
