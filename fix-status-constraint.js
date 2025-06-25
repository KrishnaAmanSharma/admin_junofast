import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStatusConstraint() {
  try {
    console.log('🔧 Updating order status constraint...');

    // Update status constraint to include all valid statuses
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status = ANY (ARRAY[
          'Pending'::text, 
          'Broadcasted'::text, 
          'Confirmed'::text, 
          'Price Accepted'::text, 
          'In Progress'::text, 
          'Completed'::text, 
          'Canceled'::text
        ]));
      `
    });

    if (error) {
      console.error('❌ Error updating constraint:', error);
      return;
    }

    console.log('✅ Status constraint updated successfully!');
    console.log('Valid statuses: Pending → Broadcasted → Confirmed → Price Accepted → In Progress → Completed/Canceled');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixStatusConstraint();