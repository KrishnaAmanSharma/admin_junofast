import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrderStatus() {
  try {
    // Drop the existing constraint
    const dropResult = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders DROP CONSTRAINT orders_status_check;'
    });
    
    console.log('Dropped existing constraint');
    
    // Add new constraint with "Assigned" status
    const addResult = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE orders 
            ADD CONSTRAINT orders_status_check 
            CHECK (status = ANY (ARRAY[
              'Pending'::text, 
              'Assigned'::text,
              'Confirmed'::text, 
              'In Progress'::text, 
              'Completed'::text, 
              'Cancelled'::text, 
              'Price Updated'::text, 
              'Price Accepted'::text
            ]));`
    });
    
    console.log('Added new constraint with Assigned status');
    console.log('Order status constraint updated successfully!');
    
  } catch (error) {
    console.error('Error updating constraint:', error);
  }
}

fixOrderStatus();