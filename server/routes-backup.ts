import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";
import { eq, desc, like } from "drizzle-orm";
import type {
  ServiceType,
  InsertServiceType,
  CommonItem,
  InsertCommonItem,
  ServiceQuestion,
  InsertServiceQuestion,
  Order,
  UpdateOrder,
  Profile,
  CommonItemInOrder,
  CustomItem,
  OrderQuestionAnswer
} from "../shared/schema.js";

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

const useRealDatabase = !!process.env.DATABASE_URL;
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export class PostgresStorage implements IStorage {
  async getServiceTypes(): Promise<ServiceType[]> {
    return await db.select().from(schema.serviceTypes).orderBy(desc(schema.serviceTypes.createdAt));
  }

  async getServiceType(id: string): Promise<ServiceType | undefined> {
    const result = await db.select().from(schema.serviceTypes).where(eq(schema.serviceTypes.id, id));
    return result[0];
  }

  async createServiceType(serviceType: InsertServiceType): Promise<ServiceType> {
    const result = await db.insert(schema.serviceTypes).values(serviceType).returning();
    return result[0];
  }

  async updateServiceType(id: string, serviceType: Partial<InsertServiceType>): Promise<ServiceType> {
    const result = await db.update(schema.serviceTypes).set(serviceType).where(eq(schema.serviceTypes.id, id)).returning();
    return result[0];
  }

  async deleteServiceType(id: string): Promise<void> {
    await db.delete(schema.serviceTypes).where(eq(schema.serviceTypes.id, id));
  }

  async getCommonItems(serviceTypeId?: string): Promise<CommonItem[]> {
    let query = db.select().from(schema.commonItems);
    
    if (serviceTypeId) {
      query = query.where(eq(schema.commonItems.serviceTypeId, serviceTypeId));
    }

    return await query.orderBy(desc(schema.commonItems.createdAt));
  }

  async getCommonItem(id: string): Promise<CommonItem | undefined> {
    const result = await db.select().from(schema.commonItems).where(eq(schema.commonItems.id, id));
    return result[0];
  }

  async createCommonItem(item: InsertCommonItem): Promise<CommonItem> {
    const result = await db.insert(schema.commonItems).values(item).returning();
    return result[0];
  }

  async updateCommonItem(id: string, item: Partial<InsertCommonItem>): Promise<CommonItem> {
    const result = await db.update(schema.commonItems).set(item).where(eq(schema.commonItems.id, id)).returning();
    return result[0];
  }

  async deleteCommonItem(id: string): Promise<void> {
    await db.delete(schema.commonItems).where(eq(schema.commonItems.id, id));
  }

  async getServiceQuestions(serviceTypeId?: string): Promise<ServiceQuestion[]> {
    let query = db.select().from(schema.serviceQuestions);
    
    if (serviceTypeId) {
      query = query.where(eq(schema.serviceQuestions.serviceTypeId, serviceTypeId));
    }

    return await query.orderBy(schema.serviceQuestions.displayOrder);
  }

  async getServiceQuestion(id: string): Promise<ServiceQuestion | undefined> {
    const result = await db.select().from(schema.serviceQuestions).where(eq(schema.serviceQuestions.id, id));
    return result[0];
  }

  async createServiceQuestion(question: InsertServiceQuestion): Promise<ServiceQuestion> {
    const result = await db.insert(schema.serviceQuestions).values(question).returning();
    return result[0];
  }

  async updateServiceQuestion(id: string, question: Partial<InsertServiceQuestion>): Promise<ServiceQuestion> {
    const result = await db.update(schema.serviceQuestions).set(question).where(eq(schema.serviceQuestions.id, id)).returning();
    return result[0];
  }

  async deleteServiceQuestion(id: string): Promise<void> {
    await db.delete(schema.serviceQuestions).where(eq(schema.serviceQuestions.id, id));
  }

  async getOrders(filters?: { status?: string; serviceType?: string; limit?: number }): Promise<Order[]> {
    let query = db.select().from(schema.orders);
    
    if (filters?.status) {
      query = query.where(eq(schema.orders.status, filters.status));
    }
    
    if (filters?.serviceType) {
      query = query.where(eq(schema.orders.serviceType, filters.serviceType));
    }

    const orders = await query.orderBy(desc(schema.orders.createdAt)).limit(filters?.limit || 50);
    return orders;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async updateOrder(id: string, updates: Partial<UpdateOrder>): Promise<Order> {
    const result = await db.update(schema.orders).set(updates).where(eq(schema.orders.id, id)).returning();
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

      // Use direct postgres connection to execute your exact optimized SQL query
      const postgres = require('postgres');
      const sql = postgres(process.env.DATABASE_URL!);
      
      let orderDetailsData: any[] = [];
      let commonItemsData: any[] = [];
      let customItemsData: any[] = [];
      let questionAnswersData: any[] = [];
      
      try {
        const optimizedResults = await sql`
          SELECT
            o.*,
            -- Order details as JSON array
            COALESCE(
              (
                SELECT json_agg(od)
                FROM order_details od
                WHERE od.order_id = o.id
              ), '[]'::json
            ) AS order_details,
            -- Common items as JSON array
            COALESCE(
              (
                SELECT json_agg(ci)
                FROM common_items_in_orders ci
                WHERE ci.order_id = o.id
              ), '[]'::json
            ) AS common_items,
            -- Custom items as JSON array, including their photos
            COALESCE(
              (
                SELECT json_agg(
                  jsonb_set(
                    to_jsonb(cu),
                    '{photos}',
                    COALESCE(
                      (
                        SELECT json_agg(ip.photo_url)
                        FROM item_photos ip
                        WHERE ip.custom_item_id = cu.id
                      )::jsonb,
                      '[]'::jsonb
                    )
                  )
                )
                FROM custom_items cu
                WHERE cu.order_id = o.id
              ), '[]'::json
            ) AS custom_items,
            -- Question answers as JSON array
            COALESCE(
              (
                SELECT json_agg(qa)
                FROM order_question_answers qa
                WHERE qa.order_id = o.id
              ), '[]'::json
            ) AS question_answers
          FROM orders o
          WHERE o.id = ${id}
        `;
        
        if (optimizedResults.length > 0) {
          const result = optimizedResults[0];
          
          // Extract nested data from the optimized query results  
          orderDetailsData = result.order_details || [];
          commonItemsData = result.common_items || [];
          customItemsData = result.custom_items || [];
          questionAnswersData = result.question_answers || [];
          
          console.log(`Order ${id} - Found using optimized query:`);
          console.log('- Order details:', orderDetailsData.length);
          console.log('- Common items:', commonItemsData.length);
          console.log('- Custom items:', customItemsData.length);
          console.log('- Question answers:', questionAnswersData.length);
        }
        
        await sql.end();
      } catch (sqlError) {
        console.error('Optimized SQL query failed, falling back to Supabase:', sqlError);
        await sql.end();
        
        // Fallback to individual Supabase queries
        const [
          { data: fallbackOrderDetails, error: odError },
          { data: fallbackCommonItems, error: ciError },
          { data: fallbackCustomItems, error: cuError },
          { data: fallbackQuestionAnswers, error: qaError }
        ] = await Promise.all([
          supabase.from('order_details').select('*').eq('order_id', id),
          supabase.from('common_items_in_orders').select('*').eq('order_id', id),
          supabase.from('custom_items').select('*').eq('order_id', id),
          supabase.from('order_question_answers').select('*').eq('order_id', id)
        ]);

        orderDetailsData = fallbackOrderDetails || [];
        commonItemsData = fallbackCommonItems || [];
        customItemsData = fallbackCustomItems || [];
        questionAnswersData = fallbackQuestionAnswers || [];

        if (odError) console.error('Order details error:', odError);
        if (ciError) console.error('Common items error:', ciError);
        if (cuError) console.error('Custom items error:', cuError);
        if (qaError) console.error('Question answers error:', qaError);
      }

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
      const mappedOrder: Order = {
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
      const userProfile: Profile | null = orderData.profile ? {
        id: orderData.profile.id,
        email: orderData.profile.email,
        fullName: `${orderData.profile.first_name || ''} ${orderData.profile.last_name || ''}`.trim() || null,
        phoneNumber: orderData.profile.phone,
        avatarUrl: orderData.profile.avatar_url || null,
        createdAt: orderData.profile.created_at,
        updatedAt: orderData.profile.updated_at,
      } : null;

      // Process common items
      const commonItems = (commonItemsData || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        itemId: item.item_id,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        quantity: item.quantity,
        createdAt: item.created_at,
      }));

      // Process custom items with photos
      const customItems = (customItemsData || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        createdAt: item.created_at,
        photos: itemPhotos.filter((photo: any) => photo.custom_item_id === item.id).map((photo: any) => ({
          ...photo,
          photoUrl: photo.photo_url,
          createdAt: photo.created_at
        }))
      }));

      // Process question answers
      const questionAnswers = (questionAnswersData || []).map((qa: any) => ({
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

      // Process order details
      const orderDetails = (orderDetailsData || []).map((detail: any) => ({
        id: detail.id,
        orderId: detail.order_id,
        name: detail.name,
        value: detail.value,
        createdAt: detail.created_at,
      }));

      console.log(`Order ${id}: Found ${orderDetails.length} details, ${commonItems.length} common items, ${customItems.length} custom items, ${questionAnswers.length} answers`);

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
    const result = await db.update(schema.profiles).set(updates).where(eq(schema.profiles.id, id)).returning();
    return result[0];
  }

  async getDashboardMetrics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeOrders: number;
    newUsers: number;
  }> {
    // Implement dashboard metrics
    return {
      totalOrders: 0,
      totalRevenue: 0,
      activeOrders: 0,
      newUsers: 0,
    };
  }

  async getRecentOrdersRequiringAttention(): Promise<Array<Order & { profile: Profile | null }>> {
    // Implement recent orders
    return [];
  }
}

export const storage = new PostgresStorage();