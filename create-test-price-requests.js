import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestPriceRequests() {
  try {
    console.log('Creating test price update requests...');

    // First, create the table if it doesn't exist
    const { error: tableError } = await supabase
      .from('price_update_requests')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === 'PGRST106') {
      console.log('Creating price_update_requests table...');
      
      // Create table using direct insert (will fail gracefully if table doesn't exist)
      try {
        await supabase.rpc('sql', {
          query: `
            CREATE TABLE IF NOT EXISTS price_update_requests (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              order_id uuid REFERENCES orders(id),
              vendor_id uuid REFERENCES vendor_profiles(id),
              requested_price numeric NOT NULL,
              reason text NOT NULL,
              status text DEFAULT 'pending',
              admin_response text,
              created_at timestamptz DEFAULT now(),
              reviewed_at timestamptz
            );
          `
        });
      } catch (sqlError) {
        console.log('Table creation via RPC failed, continuing with manual insert...');
      }
    }

    // Get an existing order and vendor for testing
    const { data: orders } = await supabase
      .from('orders')
      .select('id, approx_price')
      .eq('status', 'Broadcasted')
      .limit(1);

    const { data: vendors } = await supabase
      .from('vendor_profiles')
      .select('id, business_name')
      .eq('status', 'approved')
      .limit(2);

    if (!orders?.length || !vendors?.length) {
      console.log('No suitable orders or vendors found for testing');
      return;
    }

    const orderId = orders[0].id;
    const originalPrice = orders[0].approx_price || 8000;

    // Create sample price update requests
    const testRequests = [
      {
        order_id: orderId,
        vendor_id: vendors[0].id,
        requested_price: originalPrice + 500,
        reason: 'Additional equipment needed for heavy items and extra manpower required',
        status: 'pending'
      }
    ];

    if (vendors.length > 1) {
      testRequests.push({
        order_id: orderId,
        vendor_id: vendors[1].id,
        requested_price: originalPrice - 200,
        reason: 'We can offer a competitive price with our current capacity',
        status: 'pending'
      });
    }

    // Try to insert directly into the table
    const { data: insertedRequests, error: insertError } = await supabase
      .from('price_update_requests')
      .insert(testRequests)
      .select(`
        *,
        vendor_profiles (
          business_name,
          full_name,
          city
        )
      `);

    if (insertError) {
      console.error('Error inserting test requests:', insertError);
      
      // Fallback: Create via API endpoint
      console.log('Trying via API endpoint...');
      
      for (const request of testRequests) {
        try {
          const response = await fetch(`http://localhost:5000/api/orders/${orderId}/price-requests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              vendor_id: request.vendor_id,
              requested_price: request.requested_price,
              reason: request.reason
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Created price request for ${vendors.find(v => v.id === request.vendor_id)?.business_name}`);
          }
        } catch (apiError) {
          console.error('API request failed:', apiError);
        }
      }
      
      return;
    }

    console.log('✅ Created price update requests:');
    insertedRequests?.forEach((request, index) => {
      console.log(`  ${index + 1}. ${request.vendor_profiles?.business_name} - ₹${request.requested_price}`);
      console.log(`     Reason: "${request.reason}"`);
    });

    console.log('\n🎉 Price update request system ready!');
    console.log('📋 Admin can now:');
    console.log('   - View dedicated price requests in order details');
    console.log('   - Approve/reject requests with admin responses');
    console.log('   - Automatically update order prices when approved');
    console.log('   - Track vendor price negotiation history');

  } catch (error) {
    console.error('Error creating test price requests:', error);
  }
}

createTestPriceRequests();