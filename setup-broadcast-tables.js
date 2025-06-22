import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBroadcastTables() {
  try {
    console.log('🚀 Setting up vendor broadcast tables...');

    // Create order_broadcasts table
    const createOrderBroadcasts = `
      CREATE TABLE IF NOT EXISTS order_broadcasts (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        order_id uuid NOT NULL,
        vendor_id uuid NOT NULL,
        broadcast_at timestamp with time zone DEFAULT now(),
        status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text])),
        response_at timestamp with time zone,
        expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
        created_at timestamp with time zone DEFAULT now(),
        CONSTRAINT order_broadcasts_pkey PRIMARY KEY (id),
        CONSTRAINT order_broadcasts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
        CONSTRAINT order_broadcasts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
        CONSTRAINT order_broadcasts_unique UNIQUE (order_id, vendor_id)
      );
    `;

    // Create vendor_responses table
    const createVendorResponses = `
      CREATE TABLE IF NOT EXISTS vendor_responses (
        id uuid NOT NULL DEFAULT uuid_generate_v4(),
        broadcast_id uuid NOT NULL,
        order_id uuid NOT NULL,
        vendor_id uuid NOT NULL,
        response_type text NOT NULL CHECK (response_type = ANY (ARRAY['accept'::text, 'reject'::text, 'price_update'::text])),
        message text,
        proposed_price numeric,
        original_price numeric,
        admin_approved boolean DEFAULT false,
        admin_response text,
        created_at timestamp with time zone DEFAULT now(),
        reviewed_at timestamp with time zone,
        CONSTRAINT vendor_responses_pkey PRIMARY KEY (id),
        CONSTRAINT vendor_responses_broadcast_id_fkey FOREIGN KEY (broadcast_id) REFERENCES public.order_broadcasts(id) ON DELETE CASCADE,
        CONSTRAINT vendor_responses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
        CONSTRAINT vendor_responses_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id) ON DELETE CASCADE
      );
    `;

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_order_broadcasts_order_id ON order_broadcasts(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_broadcasts_vendor_id ON order_broadcasts(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_order_broadcasts_status ON order_broadcasts(status);
      CREATE INDEX IF NOT EXISTS idx_vendor_responses_order_id ON vendor_responses(order_id);
      CREATE INDEX IF NOT EXISTS idx_vendor_responses_vendor_id ON vendor_responses(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_vendor_responses_admin_approved ON vendor_responses(admin_approved);
    `;

    // Update orders table status constraint
    const updateOrdersConstraint = `
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS orders_status_check;

      ALTER TABLE orders 
      ADD CONSTRAINT orders_status_check 
      CHECK (status = ANY (ARRAY[
        'Pending'::text,
        'Broadcasted'::text,
        'Vendor Accepted'::text, 
        'Confirmed'::text, 
        'In Progress'::text, 
        'Completed'::text, 
        'Cancelled'::text, 
        'Price Updated'::text, 
        'Price Accepted'::text
      ]));
    `;

    console.log('Creating order_broadcasts table...');
    const { error: orderBroadcastsError } = await supabase.rpc('exec_sql', {
      sql: createOrderBroadcasts
    });

    if (orderBroadcastsError) {
      console.error('Error creating order_broadcasts table:', orderBroadcastsError);
    } else {
      console.log('✅ order_broadcasts table created');
    }

    console.log('Creating vendor_responses table...');
    const { error: vendorResponsesError } = await supabase.rpc('exec_sql', {
      sql: createVendorResponses
    });

    if (vendorResponsesError) {
      console.error('Error creating vendor_responses table:', vendorResponsesError);
    } else {
      console.log('✅ vendor_responses table created');
    }

    console.log('Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: createIndexes
    });

    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
    } else {
      console.log('✅ Indexes created');
    }

    console.log('Updating orders status constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: updateOrdersConstraint
    });

    if (constraintError) {
      console.error('Error updating constraint:', constraintError);
    } else {
      console.log('✅ Orders status constraint updated');
    }

    console.log('\n🎉 Vendor broadcast system setup completed successfully!');
    console.log('📋 Created tables: order_broadcasts, vendor_responses');
    console.log('📊 Added indexes for better performance');
    console.log('🔄 Updated order status constraints');

  } catch (error) {
    console.error('❌ Error setting up broadcast tables:', error);
  }
}

setupBroadcastTables();