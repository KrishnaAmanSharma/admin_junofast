import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createVendorResponses() {
  try {
    console.log('🎯 Creating vendor acceptance responses...');

    // First get the broadcasted order and vendors
    const { data: broadcasts, error: broadcastError } = await supabase
      .from('order_broadcasts')
      .select(`
        id,
        order_id,
        vendor_id,
        vendor_profiles (
          business_name,
          full_name
        )
      `)
      .eq('status', 'pending')
      .limit(2);

    if (broadcastError || !broadcasts || broadcasts.length === 0) {
      console.error('No pending broadcasts found:', broadcastError);
      return;
    }

    console.log(`Found ${broadcasts.length} pending broadcasts`);

    // Create vendor acceptance responses
    const responses = [
      {
        broadcast_id: broadcasts[0].id,
        order_id: broadcasts[0].order_id,
        vendor_id: broadcasts[0].vendor_id,
        response_type: 'accept',
        message: 'We are ready to handle this relocation project. Our team has extensive experience in PG relocations.',
        proposed_price: 8500,
        original_price: 8000,
        admin_approved: false,
        created_at: new Date().toISOString()
      }
    ];

    // Add second vendor response if available
    if (broadcasts.length > 1) {
      responses.push({
        broadcast_id: broadcasts[1].id,
        order_id: broadcasts[1].order_id,
        vendor_id: broadcasts[1].vendor_id,
        response_type: 'accept',
        message: 'We can complete this job efficiently. We offer competitive pricing and quality service.',
        proposed_price: 7800,
        original_price: 8000,
        admin_approved: false,
        created_at: new Date().toISOString()
      });

      // Add a price update request from the second vendor
      responses.push({
        broadcast_id: broadcasts[1].id,
        order_id: broadcasts[1].order_id,
        vendor_id: broadcasts[1].vendor_id,
        response_type: 'price_update',
        message: 'Due to current fuel costs, we need to adjust our pricing slightly.',
        proposed_price: 8200,
        original_price: 7800,
        admin_approved: false,
        created_at: new Date().toISOString()
      });
    }

    // Insert the responses
    const { data: insertedResponses, error: responseError } = await supabase
      .from('vendor_responses')
      .insert(responses)
      .select(`
        *,
        vendor_profiles (
          business_name,
          full_name,
          phone_number,
          city
        )
      `);

    if (responseError) {
      console.error('Error inserting responses:', responseError);
      return;
    }

    console.log('✅ Created vendor responses:');
    insertedResponses.forEach((response, index) => {
      console.log(`  ${index + 1}. ${response.vendor_profiles.business_name} - ${response.response_type}`);
      console.log(`     Message: "${response.message}"`);
      console.log(`     Price: ₹${response.proposed_price}`);
    });

    // Update the order status to "Vendor Accepted" since we have acceptances
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'Vendor Accepted' })
      .eq('id', broadcasts[0].order_id);

    if (orderError) {
      console.error('Error updating order status:', orderError);
    } else {
      console.log('✅ Updated order status to "Vendor Accepted"');
    }

    console.log('\n🎉 Vendor acceptance simulation completed!');
    console.log('📋 Admin can now:');
    console.log('   - View vendor acceptances in order details');
    console.log('   - Approve vendor and assign order');
    console.log('   - Review price update requests');
    console.log('   - Confirm final vendor selection');

  } catch (error) {
    console.error('Error creating vendor responses:', error);
  }
}

createVendorResponses();