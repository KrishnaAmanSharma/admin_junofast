import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPriceUpdateTable() {
  try {
    console.log('🏗️ Creating price_update_requests table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.price_update_requests (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        order_id uuid NULL,
        vendor_id uuid NULL,
        requested_price numeric NOT NULL,
        reason text NOT NULL,
        status text NULL DEFAULT 'pending'::text,
        admin_response text NULL,
        created_at timestamp with time zone NULL DEFAULT now(),
        reviewed_at timestamp with time zone NULL,
        CONSTRAINT price_update_requests_pkey PRIMARY KEY (id),
        CONSTRAINT price_update_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id),
        CONSTRAINT price_update_requests_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendor_profiles (id)
      );
    `;

    // Create the table using RPC call (since direct SQL execution is available in Supabase)
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }

    console.log('✅ price_update_requests table created successfully');

    // Create indexes for better performance
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_price_update_requests_order_id ON price_update_requests(order_id);
      CREATE INDEX IF NOT EXISTS idx_price_update_requests_vendor_id ON price_update_requests(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_price_update_requests_status ON price_update_requests(status);
      CREATE INDEX IF NOT EXISTS idx_price_update_requests_created_at ON price_update_requests(created_at);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Enable RLS and create policies
    const rlsSQL = `
      ALTER TABLE price_update_requests ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Allow all operations on price_update_requests" 
      ON price_update_requests FOR ALL USING (true) WITH CHECK (true);
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    } else {
      console.log('✅ Row Level Security enabled');
    }

    console.log('\n🎉 Price update requests table setup completed!');
    console.log('📋 Table structure:');
    console.log('   - id: Primary key UUID');
    console.log('   - order_id: References orders table');
    console.log('   - vendor_id: References vendor_profiles table');
    console.log('   - requested_price: Vendor\'s proposed price');
    console.log('   - reason: Vendor\'s justification for price change');
    console.log('   - status: pending/approved/rejected');
    console.log('   - admin_response: Admin\'s approval/rejection message');
    console.log('   - created_at/reviewed_at: Timestamps');

  } catch (error) {
    console.error('Error setting up price update table:', error);
  }
}

createPriceUpdateTable();