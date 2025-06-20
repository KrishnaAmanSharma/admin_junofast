import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServiceTypeSchema, insertCommonItemSchema, insertServiceQuestionSchema, updateOrderSchema } from "@shared/schema";
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
      const filters = {
        status: req.query.status as string,
        serviceType: req.query.serviceType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const orderDetails = await storage.getOrderDetails(req.params.id);
      res.json(orderDetails);
    } catch (error) {
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
      
      res.json(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles", details: error instanceof Error ? error.message : String(error) });
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
