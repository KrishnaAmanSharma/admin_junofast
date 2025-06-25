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

  // Vendors Routes
  app.get("/api/vendors", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const filters = {
        city: req.query.city as string,
        serviceType: req.query.serviceType as string,
        status: req.query.status as string,
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
      };

      console.log('Vendor API called with filters:', filters);

      // Start with a basic query to get all vendors first
      let query = supabase
        .from('vendor_profiles')
        .select('*');

      // First, let's get all vendors to see what's in the table
      const { data: allVendors, error: allError } = await supabase
        .from('vendor_profiles')
        .select('*');

      console.log('Total vendors in database:', allVendors?.length || 0);
      if (allVendors && allVendors.length > 0) {
        console.log('Sample vendor:', JSON.stringify(allVendors[0], null, 2));
      }

      // Apply filters only if we have vendors
      if (allVendors && allVendors.length > 0) {
        query = supabase
          .from('vendor_profiles')
          .select('*')
          .order('rating', { ascending: false });

        // Filter by city if provided
        if (filters.city) {
          console.log('Filtering by city:', filters.city);
          query = query.eq('city', filters.city);
        }

        // Filter by service type if provided
        if (filters.serviceType) {
          console.log('Filtering by service type:', filters.serviceType);
          query = query.contains('service_types', [filters.serviceType]);
        }

        // Filter by status - default to show all if not specified
        const statusFilter = filters.status || 'all';
        console.log('Status filter:', statusFilter);
        
        if (statusFilter === 'approved') {
          query = query.eq('status', 'approved');
        } else if (statusFilter === 'online') {
          query = query.eq('status', 'approved').eq('is_online', true);
        }
        // For 'all', don't add status filter

        // Filter by minimum rating if provided
        if (filters.rating) {
          console.log('Filtering by rating >= :', filters.rating);
          query = query.gte('rating', filters.rating);
        }

        const { data: vendors, error } = await query;

        if (error) {
          console.error('Error fetching filtered vendors:', error);
          return res.status(500).json({ error: 'Failed to fetch vendors' });
        }

        console.log('Filtered vendors count:', vendors?.length || 0);
        res.json(vendors || []);
      } else {
        // No vendors in database or error fetching
        if (allError) {
          console.error('Error fetching all vendors:', allError);
          return res.status(500).json({ error: 'Failed to fetch vendors' });
        }
        
        console.log('No vendors found in database');
        res.json([]);
      }

    } catch (error) {
      console.error('Error in vendors API:', error);
      res.status(500).json({ error: 'Internal server error' });
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
        dateRange: req.query.dateRange as string,
        search: req.query.search as string,
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
        } else {
          console.error('Profile fetch error:', profileError);
        }
      }
      
      // Map database field names to frontend field names and attach profiles
      let mappedOrders = (orders || []).map(order => {
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
            fullName: profile.full_name || profile.email || 'Unknown User',
            phoneNumber: profile.phone_number,
            avatarUrl: profile.avatar_url || null,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          } : null
        };
      });

      // Apply search filter if provided
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase().trim();
        mappedOrders = mappedOrders.filter(order => {
          // Search in order ID
          if (order.id.toLowerCase().includes(searchTerm)) return true;
          
          // Search in service type
          if (order.serviceType?.toLowerCase().includes(searchTerm)) return true;
          
          // Search in customer profile data
          if (order.profile) {
            if (order.profile.email?.toLowerCase().includes(searchTerm)) return true;
            if (order.profile.fullName?.toLowerCase().includes(searchTerm)) return true;
            if (order.profile.phoneNumber?.includes(searchTerm)) return true;
          }
          
          // Search in addresses
          if (order.pickupAddress?.toLowerCase().includes(searchTerm)) return true;
          if (order.dropAddress?.toLowerCase().includes(searchTerm)) return true;
          
          return false;
        });
      }

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
            fullName: profileData.full_name || profileData.email || 'Unknown User',
            phoneNumber: profileData.phone_number,
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
      if (updateData.vendorId !== undefined) {
        // Check if order already has a vendor assigned before allowing vendor update
        const { data: existingOrder, error: fetchError } = await supabase
          .from('orders')
          .select('vendor_id')
          .eq('id', id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching existing order:', fetchError);
          return res.status(500).json({ error: 'Failed to fetch order details' });
        }
        
        if (existingOrder.vendor_id && existingOrder.vendor_id !== updateData.vendorId) {
          return res.status(400).json({ 
            error: 'Order already has a vendor assigned',
            message: 'Cannot assign another vendor to this order'
          });
        }
        
        dbUpdateData['vendor_id'] = updateData.vendorId;
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
        vendorId: updatedOrder.vendor_id,
      };
      
      console.log(`Successfully updated order ${id}`);
      res.json(mappedOrder);
    } catch (error) {
      console.error('Order update error:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Order broadcast endpoint for vendor assignment
  app.post("/api/orders/:id/broadcast", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { id: orderId } = req.params;
      const { vendorIds, criteria } = req.body;
      
      // First, check if order has a valid price set
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('approx_price')
        .eq('id', orderId)
        .single();
        
      if (orderFetchError) {
        console.error('Error fetching order:', orderFetchError);
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (!orderData.approx_price || orderData.approx_price <= 0) {
        return res.status(400).json({ 
          error: 'Price validation failed',
          message: 'Order must have a valid price set before broadcasting to vendors'
        });
      }
      
      console.log(`Broadcasting order ${orderId} to ${vendorIds.length} vendors`);
      
      // Update order status to "Broadcasted"
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'Broadcasted' })
        .eq('id', orderId);
        
      if (orderUpdateError) {
        console.error('Error updating order status:', orderUpdateError);
        return res.status(500).json({ error: 'Failed to update order status' });
      }
      
      // Create broadcast records for each vendor
      const broadcastRecords = vendorIds.map((vendorId: string) => ({
        order_id: orderId,
        vendor_id: vendorId,
        broadcast_at: new Date().toISOString(),
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }));
      
      const { data: broadcasts, error: broadcastError } = await supabase
        .from('order_broadcasts')
        .insert(broadcastRecords)
        .select();
        
      if (broadcastError) {
        console.error('Error creating broadcasts:', broadcastError);
        return res.status(500).json({ error: 'Failed to broadcast to vendors' });
      }
      
      console.log(`Successfully broadcasted order to ${broadcasts?.length || 0} vendors`);
      
      res.json({ 
        success: true, 
        broadcastCount: broadcasts?.length || 0,
        orderId,
        criteria 
      });
      
    } catch (error) {
      console.error('Error in order broadcast:', error);
      res.status(500).json({ error: 'Failed to broadcast order' });
    }
  });

  // Get vendor responses for an order
  app.get("/api/orders/:id/vendor-responses", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { id: orderId } = req.params;
      
      // Get all broadcasts for this order with vendor info
      const { data: broadcasts, error: broadcastError } = await supabase
        .from('order_broadcasts')
        .select(`
          *,
          vendor_profiles (
            id,
            business_name,
            full_name,
            city,
            rating,
            is_online
          )
        `)
        .eq('order_id', orderId)
        .order('broadcast_at', { ascending: false });
        
      if (broadcastError) {
        console.error('Error fetching broadcasts:', broadcastError);
        return res.status(500).json({ error: 'Failed to fetch vendor responses' });
      }
      
      // Get vendor responses
      const { data: responses, error: responsesError } = await supabase
        .from('vendor_responses')
        .select(`
          *,
          vendor_profiles (
            id,
            business_name,
            full_name,
            city,
            rating
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
        
      if (responsesError) {
        console.error('Error fetching responses:', responsesError);
        return res.status(500).json({ error: 'Failed to fetch vendor responses' });
      }
      
      res.json({
        broadcasts: broadcasts || [],
        responses: responses || []
      });
      
    } catch (error) {
      console.error('Error fetching vendor responses:', error);
      res.status(500).json({ error: 'Failed to fetch vendor responses' });
    }
  });

  // Approve vendor price update request or vendor acceptance
  app.post("/api/orders/:orderId/approve-price/:responseId", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { orderId, responseId } = req.params;
      const { approved, adminResponse, updateOrderPrice } = req.body;
      
      // Get the vendor response details first
      const { data: responseData, error: getResponseError } = await supabase
        .from('vendor_responses')
        .select('*')
        .eq('id', responseId)
        .single();
        
      if (getResponseError) {
        console.error('Error fetching response:', getResponseError);
        return res.status(500).json({ error: 'Failed to fetch response details' });
      }
      
      // Update the vendor response
      const { error: responseError } = await supabase
        .from('vendor_responses')
        .update({
          admin_approved: approved,
          admin_response: adminResponse,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', responseId);
        
      if (responseError) {
        console.error('Error updating response:', responseError);
        return res.status(500).json({ error: 'Failed to update response' });
      }
      
      // If approved, handle different response types
      if (approved) {
        // First, check if order already has a vendor assigned
        const { data: orderData, error: orderFetchError } = await supabase
          .from('orders')
          .select('vendor_id, status')
          .eq('id', orderId)
          .single();
          
        if (orderFetchError) {
          console.error('Error fetching order:', orderFetchError);
          return res.status(500).json({ error: 'Failed to fetch order details' });
        }
        
        // Prevent assignment if vendor is already assigned
        if (orderData.vendor_id && (responseData.response_type === 'accept' || responseData.response_type === 'price_update')) {
          return res.status(400).json({ 
            error: 'Order already has a vendor assigned',
            message: 'Cannot assign another vendor to this order'
          });
        }
        
        let orderUpdates: any = {};
        
        // For vendor acceptances, assign vendor to order
        if (responseData.response_type === 'accept') {
          orderUpdates.status = 'Confirmed';
          orderUpdates.vendor_id = responseData.vendor_id;
          
          // Update broadcast status to accepted
          await supabase
            .from('order_broadcasts')
            .update({ 
              status: 'accepted',
              response_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .eq('vendor_id', responseData.vendor_id);
        }
        
        // For price updates, assign vendor to order AND update price
        if (responseData.response_type === 'price_update' || updateOrderPrice) {
          if (responseData.proposed_price || updateOrderPrice) {
            orderUpdates.approx_price = updateOrderPrice || responseData.proposed_price;
            orderUpdates.status = 'Confirmed';
            orderUpdates.vendor_id = responseData.vendor_id; // Assign vendor when approving price update
            
            // Update broadcast status to accepted for price updates too
            await supabase
              .from('order_broadcasts')
              .update({ 
                status: 'accepted',
                response_at: new Date().toISOString()
              })
              .eq('order_id', orderId)
              .eq('vendor_id', responseData.vendor_id);
          }
        }
        
        // Update the order if there are changes
        if (Object.keys(orderUpdates).length > 0) {
          const { error: orderError } = await supabase
            .from('orders')
            .update(orderUpdates)
            .eq('id', orderId);
            
          if (orderError) {
            console.error('Error updating order:', orderError);
            return res.status(500).json({ error: 'Failed to update order' });
          }
        }
      }
      
      res.json({ 
        success: true,
        approved,
        responseType: responseData.response_type,
        message: approved ? 'Response approved successfully' : 'Response rejected'
      });
      
    } catch (error) {
      console.error('Error in approve price:', error);
      res.status(500).json({ error: 'Failed to process approval' });
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

  // Approve or reject vendor
  app.post("/api/vendors/:vendorId/approve", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { vendorId } = req.params;

      const { data: vendor, error } = await supabase
        .from('vendor_profiles')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', vendorId)
        .select()
        .single();

      if (error) {
        console.error('Error approving vendor:', error);
        return res.status(500).json({ error: 'Failed to approve vendor' });
      }

      console.log(`Vendor ${vendorId} approved successfully`);
      res.json({ 
        success: true, 
        vendor,
        message: 'Vendor approved successfully' 
      });

    } catch (error) {
      console.error('Error in vendor approval:', error);
      res.status(500).json({ error: 'Failed to approve vendor' });
    }
  });

  // Reject vendor
  app.post("/api/vendors/:vendorId/reject", async (req, res) => {
    try {
      const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { vendorId } = req.params;

      const { data: vendor, error } = await supabase
        .from('vendor_profiles')
        .update({ status: 'rejected' })
        .eq('id', vendorId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting vendor:', error);
        return res.status(500).json({ error: 'Failed to reject vendor' });
      }

      console.log(`Vendor ${vendorId} rejected successfully`);
      res.json({ 
        success: true, 
        vendor,
        message: 'Vendor rejected successfully' 
      });

    } catch (error) {
      console.error('Error in vendor rejection:', error);
      res.status(500).json({ error: 'Failed to reject vendor' });
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