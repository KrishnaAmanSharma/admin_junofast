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
        dateRange: req.query.dateRange as string,
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

      if (filters.dateRange && filters.dateRange !== '') {
        // Filter orders created on or after the specified date
        query = query.gte('created_at', filters.dateRange);
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

  // Get single order with details
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch all data in parallel using Supabase client
      const [
        { data: orderData, error: orderError },
        { data: orderDetailsData, error: orderDetailsError },
        { data: commonItemsData, error: commonItemsError },
        { data: customItemsData, error: customItemsError },
        { data: questionAnswersData, error: questionAnswersError }
      ] = await Promise.all([
        supabase.from('orders').select('*').eq('id', req.params.id).single(),
        supabase.from('order_details').select('*').eq('order_id', req.params.id),
        supabase.from('common_items_in_orders').select('*').eq('order_id', req.params.id),
        supabase.from('custom_items').select('*').eq('order_id', req.params.id),
        supabase.from('order_question_answers').select('*').eq('order_id', req.params.id)
      ]);

      if (orderError) throw orderError;
      if (!orderData) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`Order ${req.params.id} - Retrieved ${orderDetailsData?.length || 0} order details`);

      // Fetch custom item photos if there are custom items
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
      
      // Get user profile
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

      // Process order details from the order_details table
      const orderDetails = (orderDetailsData || []).map((detail: any) => ({
        id: detail.id,
        orderId: detail.order_id,
        name: detail.name,
        value: detail.value,
        createdAt: detail.created_at,
      }));

      // Process other nested data
      const commonItems = (commonItemsData || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        commonItemId: item.item_id,
        quantity: item.quantity,
        name: item.name,
        description: item.description,
        imageUrl: item.image_url,
        createdAt: item.created_at,
      }));
      
      const customItems = (customItemsData || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        createdAt: item.created_at,
        photos: itemPhotos.filter(photo => photo.custom_item_id === item.id).map(photo => ({
          id: photo.id,
          photoUrl: photo.photo_url,
          createdAt: photo.created_at
        }))
      }));
      
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

      console.log(`Order ${req.params.id} - Final results:`);
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
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('Updating order:', id, 'with data:', updateData);
      
      // Map frontend field names to database field names
      const dbUpdateData: Record<string, any> = {};
      if (updateData.approxPrice !== undefined) {
        dbUpdateData['approx_price'] = updateData.approxPrice;
      }
      if (updateData.status !== undefined) {
        dbUpdateData['status'] = updateData.status;
      }
      if (updateData.finalPrice !== undefined) {
        dbUpdateData['final_price'] = updateData.finalPrice;
      }
      if (updateData.estimatedPrice !== undefined) {
        dbUpdateData['estimated_price'] = updateData.estimatedPrice;
      }
      if (updateData.notes !== undefined) {
        dbUpdateData['notes'] = updateData.notes;
      }
      
      console.log('Mapped database update data:', dbUpdateData);
      
      // Update the order using Supabase client
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Order update error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Map the response to match frontend expectations
      const mappedOrder = {
        ...updatedOrder,
        serviceType: updatedOrder.service_type,
        pickupAddress: updatedOrder.pickup_address,
        pickupPincode: updatedOrder.pickup_pincode,
        pickupLatitude: updatedOrder.pickup_latitude,
        pickupLongitude: updatedOrder.pickup_longitude,
        dropAddress: updatedOrder.drop_address,
        dropPincode: updatedOrder.drop_pincode,
        dropLatitude: updatedOrder.drop_latitude,
        dropLongitude: updatedOrder.drop_longitude,
        estimatedPrice: updatedOrder.estimated_price,
        finalPrice: updatedOrder.final_price,
        scheduledDate: updatedOrder.scheduled_date,
        completedDate: updatedOrder.completed_date,
        approxPrice: updatedOrder.approx_price,
        createdAt: updatedOrder.created_at,
        updatedAt: updatedOrder.updated_at,
        userId: updatedOrder.user_id,
      };
      
      console.log(`Successfully updated order ${id}`);
      res.json(mappedOrder);
    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Add order details endpoint using Supabase only
  app.post("/api/orders/:id/details", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, value } = req.body;

      if (!name || !value) {
        return res.status(400).json({ error: "Name and value are required" });
      }

      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: result, error } = await supabase
        .from('order_details')
        .insert({
          order_id: id,
          name,
          value
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log('Successfully inserted order detail:', result);
      res.json(result);
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