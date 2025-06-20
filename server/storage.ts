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

const client = postgres(DATABASE_URL, {
  prepare: false,
  connect_timeout: 5,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

const db = drizzle(client, { schema });

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
    if (serviceTypeId) {
      return await query.where(eq(schema.serviceQuestions.serviceTypeId, serviceTypeId))
        .orderBy(asc(schema.serviceQuestions.displayOrder));
    }
    return await query.orderBy(asc(schema.serviceQuestions.displayOrder));
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
    return result[0];
  }

  async updateServiceQuestion(id: string, question: Partial<InsertServiceQuestion>): Promise<ServiceQuestion> {
    const result = await db.update(schema.serviceQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(schema.serviceQuestions.id, id))
      .returning();
    return result[0];
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
  }> {
    const order = await this.getOrder(id);
    if (!order) throw new Error("Order not found");

    let profile = null;
    if (order.userId) {
      const profileResult = await db.select().from(schema.profiles)
        .where(eq(schema.profiles.id, order.userId));
      profile = profileResult[0] || null;
    }

    const commonItems = await db.select().from(schema.commonItemsInOrders)
      .where(eq(schema.commonItemsInOrders.orderId, id));

    const customItems = await db.select().from(schema.customItems)
      .where(eq(schema.customItems.orderId, id));

    const questionAnswers = await db.select().from(schema.orderQuestionAnswers)
      .where(eq(schema.orderQuestionAnswers.orderId, id));

    return {
      order,
      profile,
      commonItems,
      customItems,
      questionAnswers,
    };
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

// Temporarily using MockStorage until DATABASE_URL password is configured
import { MockStorage } from "./mock-storage";
export const storage = new MockStorage();
