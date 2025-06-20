import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = postgres(DATABASE_URL, {
  prepare: false,
  ssl: 'require',
});

const db = drizzle(client);

async function setupSupabaseData() {
  try {
    console.log('Connecting to Supabase database...');
    
    // Test connection
    const result = await client`SELECT 1 as test`;
    console.log('Database connection successful:', result);

    // Insert sample service types
    console.log('Inserting service types...');
    await client`
      INSERT INTO service_types (id, name, description, image_url, is_active, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'House Relocation', 'Complete household moving service including packing, transportation, and unpacking', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', true, now(), now()),
        (gen_random_uuid(), 'Office Relocation', 'Professional office moving service with minimal downtime', 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', true, now(), now()),
        (gen_random_uuid(), 'Vehicle Transportation', 'Safe and secure vehicle transportation service', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', true, now(), now()),
        (gen_random_uuid(), 'Pet Relocation', 'Safe and comfortable pet transportation service', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', true, now(), now()),
        (gen_random_uuid(), 'Industrial Equipment', 'Heavy machinery and industrial equipment moving', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', true, now(), now())
      ON CONFLICT (name) DO NOTHING
    `;

    // Insert sample profiles
    console.log('Inserting profiles...');
    await client`
      INSERT INTO profiles (id, email, full_name, phone_number, avatar_url, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), 'john.smith@example.com', 'John Smith', '+91 9876543210', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40', now(), now()),
        (gen_random_uuid(), 'sarah.wilson@example.com', 'Sarah Wilson', '+91 9876543211', 'https://images.unsplash.com/photo-1494790108755-2616b612b739?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40', now(), now()),
        (gen_random_uuid(), 'mike.johnson@example.com', 'Mike Johnson', '+91 9876543212', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40', now(), now()),
        (gen_random_uuid(), 'priya.sharma@example.com', 'Priya Sharma', '+91 9876543213', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40', now(), now()),
        (gen_random_uuid(), 'raj.patel@example.com', 'Raj Patel', '+91 9876543214', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40', now(), now())
      ON CONFLICT (email) DO NOTHING
    `;

    // Get service type and profile IDs for orders
    const serviceTypes = await client`SELECT id, name FROM service_types LIMIT 3`;
    const profiles = await client`SELECT id FROM profiles LIMIT 3`;

    if (serviceTypes.length > 0 && profiles.length > 0) {
      console.log('Inserting orders...');
      await client`
        INSERT INTO orders (id, user_id, service_type, pickup_address, pickup_pincode, pickup_latitude, pickup_longitude, drop_address, drop_pincode, status, approx_price, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), ${profiles[0].id}, ${serviceTypes[0].name}, '123 Main St, Sector 15, Gurgaon, Haryana', '122001', 28.4595, 77.0266, '456 Oak Ave, Koramangala, Bangalore, Karnataka', '560034', 'Pending', 25000, now() - interval '5 days', now() - interval '5 days'),
          (gen_random_uuid(), ${profiles[1].id}, ${serviceTypes[1].name}, '789 Business Park, Cyber City, Gurgaon, Haryana', '122002', 28.4949, 77.0787, '321 Tech Hub, Whitefield, Bangalore, Karnataka', '560066', 'In Progress', 150000, now() - interval '10 days', now() - interval '8 days'),
          (gen_random_uuid(), ${profiles[2].id}, ${serviceTypes[2].name}, '555 Residential Colony, Dwarka, Delhi', '110075', 28.5921, 77.0460, '777 New Area, Electronic City, Bangalore, Karnataka', '560100', 'Price Updated', 8000, now() - interval '2 days', now() - interval '1 day'),
          (gen_random_uuid(), ${profiles[0].id}, ${serviceTypes[0].name}, '888 Garden View, Indiranagar, Bangalore, Karnataka', '560038', 12.9716, 77.5946, '999 Lake Side, Hitech City, Hyderabad, Telangana', '500081', 'Completed', 32000, now() - interval '22 days', now() - interval '15 days')
      `;

      // Insert common items for service types
      console.log('Inserting common items...');
      await client`
        INSERT INTO common_items (id, service_type_id, name, description, image_url, is_active, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), ${serviceTypes[0].id}, 'Sofa Set', '3-seater sofa set with cushions', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300', true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[0].id}, 'Dining Table', '6-seater wooden dining table with chairs', 'https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300', true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[0].id}, 'Refrigerator', 'Double door refrigerator', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300', true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[1].id}, 'Office Desk', 'Executive office desk with drawers', 'https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300', true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[1].id}, 'Conference Table', 'Large conference room table', 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300', true, now(), now())
      `;

      // Insert service questions
      console.log('Inserting service questions...');
      await client`
        INSERT INTO service_questions (id, service_type_id, question, question_type, is_required, display_order, options, parent_question_id, is_active, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), ${serviceTypes[0].id}, 'How many rooms need to be packed?', 'number', true, 1, null, null, true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[0].id}, 'Do you need packing materials?', 'boolean', true, 2, null, null, true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[0].id}, 'Any fragile items?', 'text', false, 3, null, null, true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[1].id}, 'Number of workstations to relocate?', 'number', true, 1, null, null, true, now(), now()),
          (gen_random_uuid(), ${serviceTypes[1].id}, 'Do you need IT equipment handling?', 'boolean', true, 2, null, null, true, now(), now())
      `;
    }

    console.log('Sample data inserted successfully!');
    console.log('Your Supabase database is now ready for the admin portal.');
    
  } catch (error) {
    console.error('Error setting up Supabase data:', error);
  } finally {
    await client.end();
  }
}

setupSupabaseData();