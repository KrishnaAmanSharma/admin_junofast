import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations using Supabase client
export const supabaseStorage = {
  async getServiceTypes() {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    // Transform data to match expected schema
    return data?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) || [];
  },

  async createServiceType(serviceType: any) {
    // Transform camelCase to snake_case for database
    const dbServiceType = {
      name: serviceType.name,
      description: serviceType.description,
      image_url: serviceType.imageUrl,
      is_active: serviceType.isActive ?? true,
    };

    const { data, error } = await supabase
      .from('service_types')
      .insert([dbServiceType])
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async updateServiceType(id: string, updates: any) {
    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('service_types')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to camelCase
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async deleteServiceType(id: string) {
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCommonItems(serviceTypeId?: string) {
    let query = supabase
      .from('common_items')
      .select('*')
      .order('name');

    if (serviceTypeId && serviceTypeId !== 'all') {
      query = query.eq('service_type_id', serviceTypeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to match expected schema
    return data?.map(item => ({
      id: item.id,
      serviceTypeId: item.service_type_id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) || [];
  },

  async createCommonItem(item: any) {
    // Transform camelCase to snake_case for database
    const dbItem = {
      service_type_id: item.serviceTypeId,
      name: item.name,
      description: item.description,
      image_url: item.imageUrl,
      is_active: item.isActive ?? true,
    };

    const { data, error } = await supabase
      .from('common_items')
      .insert([dbItem])
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to camelCase
    return {
      id: data.id,
      serviceTypeId: data.service_type_id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async updateCommonItem(id: string, updates: any) {
    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.serviceTypeId !== undefined) dbUpdates.service_type_id = updates.serviceTypeId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('common_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Transform back to camelCase
    return {
      id: data.id,
      serviceTypeId: data.service_type_id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async deleteCommonItem(id: string) {
    const { error } = await supabase
      .from('common_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getServiceQuestions(serviceTypeId?: string) {
    let query = supabase
      .from('service_questions')
      .select('*')
      .order('display_order');

    if (serviceTypeId && serviceTypeId !== 'all') {
      query = query.eq('service_type_id', serviceTypeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to match expected schema - options are now stored as proper arrays
    return data?.map(question => ({
      id: question.id,
      serviceTypeId: question.service_type_id,
      question: question.question,
      questionType: question.question_type,
      isRequired: question.is_required,
      displayOrder: question.display_order,
      options: question.options, // Keep as-is since they're now proper JSON arrays
      parentQuestionId: question.parent_question_id,
      isActive: question.is_active,
      createdAt: question.created_at,
      updatedAt: question.updated_at
    })) || [];
  },

  async createServiceQuestion(question: any) {
    // 1. Get all questions for this service type, ordered by display_order
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('service_questions')
      .select('id, display_order')
      .eq('service_type_id', question.serviceTypeId)
      .order('display_order');
    if (fetchError) throw fetchError;
    let displayOrder = question.displayOrder;
    if (displayOrder === undefined || displayOrder === null || isNaN(displayOrder)) {
      // If not provided, set to next available
      displayOrder = existingQuestions.length;
    } else {
      // If provided, shift all at/after this position up by 1
      for (let i = existingQuestions.length - 1; i >= 0; i--) {
        if (existingQuestions[i].display_order >= displayOrder) {
          await supabase
            .from('service_questions')
            .update({ display_order: existingQuestions[i].display_order + 1 })
            .eq('id', existingQuestions[i].id);
        }
      }
    }
    // Insert the new question
    const dbQuestion = {
      service_type_id: question.serviceTypeId,
      question: question.question,
      question_type: question.questionType,
      is_required: question.isRequired ?? true,
      display_order: displayOrder,
      options: question.options || null,
      parent_question_id: question.parentQuestionId || null,
      is_active: question.isActive ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('service_questions')
      .insert(dbQuestion)
      .select()
      .single();
    if (error) throw error;
    // Return camelCase
    return {
      id: data.id,
      serviceTypeId: data.service_type_id,
      question: data.question,
      questionType: data.question_type,
      isRequired: data.is_required,
      displayOrder: data.display_order,
      options: data.options,
      parentQuestionId: data.parent_question_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async updateServiceQuestion(id: string, updates: any) {
    // Get the current question
    const { data: current, error: fetchError } = await supabase
      .from('service_questions')
      .select('id, service_type_id, display_order')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    let newOrder = updates.displayOrder;
    if (newOrder === undefined || newOrder === null || isNaN(newOrder)) newOrder = current.display_order;
    // If displayOrder is changing, re-sequence others
    if (newOrder !== current.display_order) {
      // Get all for this service type, ordered
      const { data: all, error: allError } = await supabase
        .from('service_questions')
        .select('id, display_order')
        .eq('service_type_id', current.service_type_id)
        .order('display_order');
      if (allError) throw allError;
      // Remove current from list
      const filtered = all.filter(q => q.id !== id);
      // Insert at newOrder
      filtered.splice(newOrder, 0, { id, display_order: newOrder });
      // Re-sequence all
      for (let i = 0; i < filtered.length; i++) {
        await supabase
          .from('service_questions')
          .update({ display_order: i })
          .eq('id', filtered[i].id);
      }
      updates.displayOrder = newOrder;
    }
    // Update the question
    const dbUpdates: any = {};
    if (updates.serviceTypeId !== undefined) dbUpdates.service_type_id = updates.serviceTypeId;
    if (updates.question !== undefined) dbUpdates.question = updates.question;
    if (updates.questionType !== undefined) dbUpdates.question_type = updates.questionType;
    if (updates.isRequired !== undefined) dbUpdates.is_required = updates.isRequired;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
    if (updates.options !== undefined) dbUpdates.options = updates.options;
    if (updates.parentQuestionId !== undefined) dbUpdates.parent_question_id = updates.parentQuestionId;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('service_questions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      serviceTypeId: data.service_type_id,
      question: data.question,
      questionType: data.question_type,
      isRequired: data.is_required,
      displayOrder: data.display_order,
      options: data.options,
      parentQuestionId: data.parent_question_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async deleteServiceQuestion(id: string) {
    // Get the question to delete
    const { data: toDelete, error: fetchError } = await supabase
      .from('service_questions')
      .select('id, service_type_id, display_order')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    // First, delete all order_question_answers referencing this question
    const { error: answerDeleteError } = await supabase
      .from('order_question_answers')
      .delete()
      .eq('question_id', id);
    if (answerDeleteError) throw answerDeleteError;
    // Then, delete the service question itself
    const { error } = await supabase
      .from('service_questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    // Resequence remaining questions for this service type
    const { data: remaining, error: remError } = await supabase
      .from('service_questions')
      .select('id')
      .eq('service_type_id', toDelete.service_type_id)
      .order('display_order');
    if (remError) throw remError;
    for (let i = 0; i < remaining.length; i++) {
      await supabase
        .from('service_questions')
        .update({ display_order: i })
        .eq('id', remaining[i].id);
    }
  },

  async getOrders(filters?: { status?: string; serviceType?: string; limit?: number }) {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'All Status') {
      query = query.eq('status', filters.status);
    }
    if (filters?.serviceType && filters.serviceType !== 'All Services') {
      query = query.eq('service_type', filters.serviceType);
    }
    if (filters?.limit) {
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
    return (orders || []).map(order => {
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
  },

  async updateOrder(id: string, updates: any) {
    // Map frontend field names to database field names
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.approxPrice !== undefined) dbUpdates.approx_price = updates.approxPrice;
    if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
    if (updates.pickupAddress !== undefined) dbUpdates.pickup_address = updates.pickupAddress;
    if (updates.pickupPincode !== undefined) dbUpdates.pickup_pincode = updates.pickupPincode;
    if (updates.dropAddress !== undefined) dbUpdates.drop_address = updates.dropAddress;
    if (updates.dropPincode !== undefined) dbUpdates.drop_pincode = updates.dropPincode;
    if (updates.vendorId !== undefined) dbUpdates.vendor_id = updates.vendorId;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Get profile data if user_id exists
    let profile = null;
    if (data.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user_id)
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
    
    // Map response back to frontend field names
    return {
      ...data,
      serviceType: data.service_type,
      pickupAddress: data.pickup_address,
      pickupPincode: data.pickup_pincode,
      pickupLatitude: data.pickup_latitude,
      pickupLongitude: data.pickup_longitude,
      dropAddress: data.drop_address,
      dropPincode: data.drop_pincode,
      approxPrice: data.approx_price,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userId: data.user_id,
      profile
    };
  },

  async getProfiles(search?: string) {
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
    return (data || []).map(profile => ({
      ...profile,
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }));
  },

  async getDashboardMetrics() {
    const [ordersData, completedOrdersData] = await Promise.all([
      supabase.from('orders').select('id, status, approx_price'),
      supabase.from('orders').select('approx_price').eq('status', 'Completed')
    ]);

    if (ordersData.error) throw ordersData.error;
    if (completedOrdersData.error) throw completedOrdersData.error;

    const totalOrders = ordersData.data.length;
    const activeOrders = ordersData.data.filter(order => order.status === 'In Progress').length;
    const totalRevenue = completedOrdersData.data.reduce((sum, order) => 
      sum + (Number(order.approx_price) || 0), 0
    );

    // Get new users from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: newUsersData, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (usersError) throw usersError;

    return {
      totalOrders,
      totalRevenue,
      activeOrders,
      newUsers: newUsersData.length,
    };
  },

  async getRecentOrdersRequiringAttention() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(5);

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
    return (orders || []).map(order => {
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
  },

  async getOrderDetails(orderId: string) {
    // Fetch the main order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

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
    const { data: commonItemsData, error: commonItemsError } = await supabase
      .from('common_items_in_orders')
      .select('*')
      .eq('order_id', orderId);

    // Fetch custom items
    const { data: customItemsData, error: customItemsError } = await supabase
      .from('custom_items')
      .select('*')
      .eq('order_id', orderId);

    // Fetch item photos for custom items
    let itemPhotos = [];
    if (customItemsData && customItemsData.length > 0) {
      const customItemIds = customItemsData.map(item => item.id);
      const { data: photosData, error: photosError } = await supabase
        .from('item_photos')
        .select('*')
        .in('custom_item_id', customItemIds);
      
      if (!photosError) {
        itemPhotos = photosData || [];
      }
    }

    // Fetch order question answers
    const { data: questionAnswersData, error: questionAnswersError } = await supabase
      .from('order_question_answers')
      .select('*')
      .eq('order_id', orderId);

    // Fetch order details
    const { data: orderDetailsData, error: orderDetailsError } = await supabase
      .from('order_details')
      .select('*')
      .eq('order_id', orderId);

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
      userId: order.user_id,
      vendorId: order.vendor_id
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

    return {
      order: mappedOrder,
      profile,
      commonItems: commonItemsData || [],
      customItems: mappedCustomItems,
      questionAnswers: mappedQuestionAnswers,
      orderDetails: mappedOrderDetails
    };
  },

  async getVendors() {
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

export const getVendors = supabaseStorage.getVendors;