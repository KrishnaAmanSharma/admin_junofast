import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServiceTypeSchema, insertCommonItemSchema, insertServiceQuestionSchema, updateOrderSchema } from "@shared/schema";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Service Types Routes
  app.get("/api/service-types", async (req, res) => {
    try {
      const serviceTypes = await storage.getServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service types" });
    }
  });

  app.get("/api/service-types/:id", async (req, res) => {
    try {
      const serviceType = await storage.getServiceType(req.params.id);
      if (!serviceType) {
        return res.status(404).json({ error: "Service type not found" });
      }
      res.json(serviceType);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service type" });
    }
  });

  app.post("/api/service-types", async (req, res) => {
    try {
      const validatedData = insertServiceTypeSchema.parse(req.body);
      const serviceType = await storage.createServiceType(validatedData);
      res.json(serviceType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create service type" });
    }
  });

  app.put("/api/service-types/:id", async (req, res) => {
    try {
      const validatedData = insertServiceTypeSchema.partial().parse(req.body);
      const serviceType = await storage.updateServiceType(req.params.id, validatedData);
      res.json(serviceType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update service type" });
    }
  });

  app.delete("/api/service-types/:id", async (req, res) => {
    try {
      await storage.deleteServiceType(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service type" });
    }
  });

  // Common Items Routes
  app.get("/api/common-items", async (req, res) => {
    try {
      const serviceTypeId = req.query.serviceTypeId as string;
      const items = await storage.getCommonItems(serviceTypeId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch common items" });
    }
  });

  app.post("/api/common-items", async (req, res) => {
    try {
      const validatedData = insertCommonItemSchema.parse(req.body);
      const item = await storage.createCommonItem(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create common item" });
    }
  });

  app.put("/api/common-items/:id", async (req, res) => {
    try {
      const validatedData = insertCommonItemSchema.partial().parse(req.body);
      const item = await storage.updateCommonItem(req.params.id, validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update common item" });
    }
  });

  app.delete("/api/common-items/:id", async (req, res) => {
    try {
      await storage.deleteCommonItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete common item" });
    }
  });

  // Service Questions Routes
  app.get("/api/service-questions", async (req, res) => {
    try {
      // Use supabase client directly to avoid connection issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!
      );
      
      const serviceTypeId = req.query.serviceTypeId as string;
      let query = supabase.from('service_questions').select('*').order('display_order');
      
      if (serviceTypeId && serviceTypeId !== 'all') {
        query = query.eq('service_type_id', serviceTypeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Transform string options to arrays for Flutter compatibility
      const transformedData = (data || []).map(question => ({
        id: question.id,
        serviceTypeId: question.service_type_id,
        question: question.question,
        questionType: question.question_type,
        isRequired: question.is_required,
        displayOrder: question.display_order,
        options: question.options && typeof question.options === 'string' 
          ? question.options.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0)
          : question.options,
        parentQuestionId: question.parent_question_id,
        isActive: question.is_active,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      }));
      
      res.json(transformedData);
    } catch (error) {
      console.error("Service questions error:", error);
      res.status(500).json({ error: "Failed to fetch service questions", details: error instanceof Error ? error.message : error });
    }
  });

  app.post("/api/service-questions", async (req, res) => {
    try {
      const validatedData = insertServiceQuestionSchema.parse(req.body);
      const question = await storage.createServiceQuestion(validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create service question" });
    }
  });

  app.put("/api/service-questions/:id", async (req, res) => {
    try {
      const validatedData = insertServiceQuestionSchema.partial().parse(req.body);
      const question = await storage.updateServiceQuestion(req.params.id, validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update service question" });
    }
  });

  app.delete("/api/service-questions/:id", async (req, res) => {
    try {
      await storage.deleteServiceQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service question" });
    }
  });

  // Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const filters = {
        status: req.query.status as string,
        serviceType: req.query.serviceType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'All Status') {
        query = query.eq('status', filters.status);
      }

      if (filters.serviceType && filters.serviceType !== 'All Services') {
        query = query.eq('service_type', filters.serviceType);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: orders, error } = await query;
      if (error) throw error;
      
      // Get unique user IDs from orders
      const allUserIds = orders?.map(order => order.user_id).filter(Boolean) || [];
      const userIds = allUserIds.filter((id, index) => allUserIds.indexOf(id) === index);
      
      // Fetch profile data separately
      let profiles = [];
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (!profileError) {
          profiles = profileData || [];
        }
      }
      
      // Map database field names to frontend field names and attach profiles
      const mappedOrders = (orders || []).map(order => {
        const profile = profiles.find(p => p.id === order.user_id);
        
        return {
          ...order,
          serviceType: order.service_type,
          pickupAddress: order.pickup_address,
          pickupPincode: order.pickup_pincode,
          pickupLatitude: order.pickup_latitude,
          pickupLongitude: order.pickup_longitude,
          dropAddress: order.drop_address,
          dropPincode: order.drop_pincode,
          approxPrice: order.approx_price,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          userId: order.user_id,
          profile: profile ? {
            ...profile,
            fullName: profile.full_name,
            phoneNumber: profile.phone_number,
            avatarUrl: profile.avatar_url
          } : null
        };
      });

      res.json(mappedOrders);
    } catch (error) {
      console.error('Orders fetch error:', error);
      res.status(500).json({ 
        error: "Failed to fetch orders", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      // Use your exact optimized SQL query that works in Supabase SQL editor
      const postgres = require('postgres');
      const sql = postgres(process.env.DATABASE_URL!);
      
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
        WHERE o.id = ${req.params.id}
      `;
      
      await sql.end();
      
      if (optimizedResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const orderData = optimizedResults[0];
      
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch user profile
      let profile = null;
      if (order.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', order.user_id)
          .single();
        
        if (!profileError && profileData) {
          profile = {
            ...profileData,
            fullName: profileData.full_name,
            phoneNumber: profileData.phone_number,
            avatarUrl: profileData.avatar_url
          };
        }
      }

      // Fetch common items in orders
      const { data: commonItemsData } = await supabase
        .from('common_items_in_orders')
        .select('*')
        .eq('order_id', req.params.id);

      // Fetch custom items
      const { data: customItemsData } = await supabase
        .from('custom_items')
        .select('*')
        .eq('order_id', req.params.id);

      // Fetch item photos for custom items
      let itemPhotos = [];
      if (customItemsData && customItemsData.length > 0) {
        const customItemIds = customItemsData.map(item => item.id);
        const { data: photosData } = await supabase
          .from('item_photos')
          .select('*')
          .in('custom_item_id', customItemIds);
        
        if (photosData) {
          itemPhotos = photosData;
        }
      }

      // Fetch order question answers
      const { data: questionAnswersData } = await supabase
        .from('order_question_answers')
        .select('*')
        .eq('order_id', req.params.id);

      // Fetch order details
      const { data: orderDetailsData } = await supabase
        .from('order_details')
        .select('*')
        .eq('order_id', req.params.id);

      // Map order with proper field names
      const mappedOrder = {
        ...order,
        serviceType: order.service_type,
        pickupAddress: order.pickup_address,
        pickupPincode: order.pickup_pincode,
        pickupLatitude: order.pickup_latitude,
        pickupLongitude: order.pickup_longitude,
        dropAddress: order.drop_address,
        dropPincode: order.drop_pincode,
        approxPrice: order.approx_price,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        userId: order.user_id
      };

      // Map custom items with their photos
      const mappedCustomItems = (customItemsData || []).map(item => ({
        ...item,
        createdAt: item.created_at,
        photos: itemPhotos.filter(photo => photo.custom_item_id === item.id).map(photo => ({
          ...photo,
          photoUrl: photo.photo_url,
          createdAt: photo.created_at
        }))
      }));

      // Map question answers
      const mappedQuestionAnswers = (questionAnswersData || []).map(qa => ({
        ...qa,
        questionType: qa.question_type,
        parentQuestionId: qa.parent_question_id,
        additionalData: qa.additional_data,
        createdAt: qa.created_at
      }));

      // Map order details
      const mappedOrderDetails = (orderDetailsData || []).map(detail => ({
        ...detail,
        createdAt: detail.created_at
      }));

      const result = {
        order: mappedOrder,
        profile,
        commonItems: commonItemsData || [],
        customItems: mappedCustomItems,
        questionAnswers: mappedQuestionAnswers,
        orderDetails: mappedOrderDetails
      };

      res.json(result);
    } catch (error) {
      console.error('Order details fetch error:', error);
      res.status(500).json({ error: "Failed to fetch order details" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const validatedData = updateOrderSchema.parse({ ...req.body, id: req.params.id });
      const order = await storage.updateOrder(req.params.id, validatedData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Add order details endpoint
  app.post("/api/orders/:id/details", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, value } = req.body;

      if (!name || !value) {
        return res.status(400).json({ error: "Name and value are required" });
      }

      const DATABASE_URL = process.env.DATABASE_URL;
      if (!DATABASE_URL) {
        return res.status(500).json({ error: "Database not configured" });
      }

      const client = postgres(DATABASE_URL, { ssl: "require" });
      const db = drizzle(client, { schema });

      const result = await db.insert(schema.orderDetails)
        .values({
          orderId: id,
          name,
          value
        })
        .returning();

      await client.end();
      res.json(result[0]);
    } catch (error) {
      console.error('Add order detail error:', error);
      res.status(500).json({ error: "Failed to add order detail" });
    }
  });

  // Users/Profiles Routes
  app.get("/api/profiles", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      const search = req.query.search as string;
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map database field names to frontend field names
      const mappedData = (data || []).map(profile => ({
        ...profile,
        fullName: profile.full_name,
        phoneNumber: profile.phone_number,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }));
      

      
      res.json(mappedData);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: "Profile not found" });
        }
        throw error;
      }
      
      // Map database field names to frontend field names
      const mappedData = {
        ...data,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      res.json(mappedData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Map frontend field names to database field names (excluding email)
      const updates = {
        full_name: req.body.fullName,
        phone_number: req.body.phoneNumber,
        avatar_url: req.body.avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map database field names to frontend field names
      const mappedData = {
        ...data,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      res.json(mappedData);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Dashboard Routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/recent-orders", async (req, res) => {
    try {
      const orders = await storage.getRecentOrdersRequiringAttention();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
