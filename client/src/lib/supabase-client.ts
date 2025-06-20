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

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, updates: any) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    return data;
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
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          phone_number,
          avatar_url
        )
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  }
};