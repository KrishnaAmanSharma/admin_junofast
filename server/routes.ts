import { Express } from "express";
import { createServer } from "http";
import { z } from "zod";
import { updateOrderSchema } from "@shared/schema";
import { storage } from "./storage";
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

export async function registerRoutes(app: Express) {
  const server = createServer(app);

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
          dropLatitude: order.drop_latitude,
          dropLongitude: order.drop_longitude,
          estimatedPrice: order.estimated_price,
          finalPrice: order.final_price,
          scheduledDate: order.scheduled_date,
          completedDate: order.completed_date,
          approxPrice: order.approx_price,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          userId: order.user_id,
          profile: profile ? {
            id: profile.id,
            email: profile.email,
            fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
            phoneNumber: profile.phone,
            avatarUrl: profile.avatar_url || null,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
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

  // Get single order with details using your optimized SQL query
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const sql = postgres(process.env.DATABASE_URL!, {
        ssl: { rejectUnauthorized: false }
      });
      
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
      
      // Get user profile from the order data
      let profile = null;
      if (orderData.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', orderData.user_id)
          .single();
        
        if (!profileError && profileData) {
          profile = {
            id: profileData.id,
            email: profileData.email,
            fullName: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || null,
            phoneNumber: profileData.phone,
            avatarUrl: profileData.avatar_url || null,
            createdAt: profileData.created_at,
            updatedAt: profileData.updated_at,
          };
        }
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

      // Process nested data exactly as returned from your optimized SQL query
      const orderDetails = orderData.order_details || [];
      const commonItems = (orderData.common_items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        commonItemId: item.item_id,
        quantity: item.quantity,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        createdAt: item.created_at,
      }));
      
      const customItems = (orderData.custom_items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        createdAt: item.created_at,
        photos: item.photos || [],
      }));
      
      const questionAnswers = (orderData.question_answers || []).map((qa: any) => ({
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

      console.log(`Order ${req.params.id} - Optimized query results:`);
      console.log('- Order details:', orderDetails.length);
      console.log('- Common items:', commonItems.length);
      console.log('- Custom items:', customItems.length);
      console.log('- Question answers:', questionAnswers.length);

      const orderResponse = {
        order: mappedOrder,
        profile,
        commonItems,
        customItems,
        questionAnswers,
        orderDetails
      };

      res.json(orderResponse);
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

      const { data: profiles, error } = await query;
      if (error) throw error;

      const mappedProfiles = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null,
        phoneNumber: profile.phone,
        avatarUrl: profile.avatar_url || null,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }));

      res.json(mappedProfiles);
    } catch (error) {
      console.error('Profiles fetch error:', error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

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

  // Common Items Routes
  app.get("/api/common-items", async (req, res) => {
    try {
      const serviceTypeId = req.query.serviceTypeId as string;
      const commonItems = await storage.getCommonItems(serviceTypeId);
      res.json(commonItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch common items" });
    }
  });

  // Service Questions Routes
  app.get("/api/service-questions", async (req, res) => {
    try {
      const serviceTypeId = req.query.serviceTypeId as string;
      const questions = await storage.getServiceQuestions(serviceTypeId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service questions" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/recent-orders", async (req, res) => {
    try {
      const orders = await storage.getRecentOrdersRequiringAttention();
      res.json(orders);
    } catch (error) {
      console.error('Recent orders error:', error);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  return server;
}