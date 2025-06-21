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
    // Use the same logic as the working routes.ts implementation
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    try {
      // Get the order with profile using optimized query
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');

      // Use optimized approach to get all nested data in parallel
      const [
        { data: orderDetailsData },
        { data: commonItemsData },
        { data: customItemsData },
        { data: questionAnswersData }
      ] = await Promise.all([
        supabase.from('order_details').select('*').eq('order_id', id),
        supabase.from('common_items_in_orders').select('*').eq('order_id', id),
        supabase.from('custom_items').select('*').eq('order_id', id),
        supabase.from('order_question_answers').select('*').eq('order_id', id)
      ]);

      // Get photos for custom items if any exist
      let itemPhotos: any[] = [];
      if (customItemsData && customItemsData.length > 0) {
        const customItemIds = customItemsData.map((item: any) => item.id);
        const { data: photosData } = await supabase
          .from('item_photos')
          .select('*')
          .in('custom_item_id', customItemIds);
        
        itemPhotos = photosData || [];
      }

      // Map order with proper field names
      const mappedOrder = {
        id: orderData.id,
        userId: orderData.user_id,
        serviceType: orderData.service_type,
        status: orderData.status,
        pickupAddress: orderData.pickup_address,
        pickupPincode: orderData.pickup_pincode,
        pickupLatitude: orderData.pickup_latitude,
        pickupLongitude: orderData.pickup_longitude,
        dropAddress: orderData.drop_address,
        dropPincode: orderData.drop_pincode,
        dropLatitude: orderData.drop_latitude,
        dropLongitude: orderData.drop_longitude,
        estimatedPrice: orderData.estimated_price,
        finalPrice: orderData.final_price,
        scheduledDate: orderData.scheduled_date,
        completedDate: orderData.completed_date,
        notes: orderData.notes,
        approxPrice: orderData.approx_price,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
      };

      // Map the profile
      const userProfile = orderData.profile ? {
        id: orderData.profile.id,
        userId: orderData.profile.user_id,
        firstName: orderData.profile.first_name,
        lastName: orderData.profile.last_name,
        email: orderData.profile.email,
        phone: orderData.profile.phone,
        createdAt: orderData.profile.created_at,
        updatedAt: orderData.profile.updated_at,
      } : null;

      // Process common items (same as routes.ts)
      const commonItems = (commonItemsData || []).map(item => ({
        id: item.id,
        orderId: item.order_id,
        itemId: item.item_id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        quantity: item.quantity,
        createdAt: item.created_at,
      }));

      // Process custom items with photos (same as routes.ts)
      const customItems = (customItemsData || []).map(item => ({
        id: item.id,
        orderId: item.order_id,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        createdAt: item.created_at,
        photos: itemPhotos.filter(photo => photo.custom_item_id === item.id).map(photo => ({
          ...photo,
          photoUrl: photo.photo_url,
          createdAt: photo.created_at
        }))
      }));

      // Process question answers (same as routes.ts)
      const questionAnswers = (questionAnswersData || []).map(qa => ({
        id: qa.id,
        orderId: qa.order_id,
        questionId: qa.question_id,
        question: qa.question,
        answer: qa.answer,
        questionType: qa.question_type,
        parentQuestionId: qa.parent_question_id,
        additionalData: qa.additional_data,
        createdAt: qa.created_at,
      }));

      // Process order details (same as routes.ts)
      const orderDetails = (orderDetailsData || []).map(detail => ({
        id: detail.id,
        orderId: detail.order_id,
        name: detail.name,
        value: detail.value,
        createdAt: detail.created_at,
      }));

      // Direct database verification
      const { data: dbCheck } = await supabase.rpc('execute_sql', {
        query: `
          SELECT 
            (SELECT COUNT(*) FROM order_details WHERE order_id = '${id}') as order_details_count,
            (SELECT COUNT(*) FROM common_items_in_orders WHERE order_id = '${id}') as common_items_count,
            (SELECT COUNT(*) FROM custom_items WHERE order_id = '${id}') as custom_items_count,
            (SELECT COUNT(*) FROM order_question_answers WHERE order_id = '${id}') as qa_count
        `
      }).catch(() => ({ data: null }));

      console.log(`Order ${id}: Found ${orderDetails.length} details, ${commonItems.length} common items, ${customItems.length} custom items, ${questionAnswers.length} answers`);
      if (dbCheck?.data) {
        console.log('Direct DB counts:', dbCheck.data);
      }

      return {
        order: mappedOrder,
        profile: userProfile,
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
