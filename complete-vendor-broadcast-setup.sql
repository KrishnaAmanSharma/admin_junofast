-- Complete Vendor Broadcast System Setup
-- Run this entire script in your Supabase SQL Editor

-- Create order_broadcasts table
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

-- Create vendor_responses table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_broadcasts_order_id ON order_broadcasts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_broadcasts_vendor_id ON order_broadcasts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_broadcasts_status ON order_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_order_id ON vendor_responses(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_vendor_id ON vendor_responses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_responses_admin_approved ON vendor_responses(admin_approved);

-- Update orders table status constraint to include new statuses
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

-- Enable Row Level Security (RLS) for the new tables
ALTER TABLE order_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow read/write access
CREATE POLICY "Allow all operations on order_broadcasts" ON order_broadcasts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vendor_responses" ON vendor_responses
  FOR ALL USING (true) WITH CHECK (true);

-- Create a function to automatically expire old broadcasts
CREATE OR REPLACE FUNCTION expire_old_broadcasts()
RETURNS void AS $$
BEGIN
  UPDATE order_broadcasts 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to automatically update response_at when status changes
CREATE OR REPLACE FUNCTION update_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    NEW.response_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_response_timestamp
  BEFORE UPDATE ON order_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_response_timestamp();

-- Insert sample data (optional - remove if not needed)
-- This creates a sample broadcast record for testing
INSERT INTO order_broadcasts (order_id, vendor_id, status) 
SELECT 
  o.id as order_id,
  vp.id as vendor_id,
  'pending' as status
FROM orders o
CROSS JOIN vendor_profiles vp
WHERE o.status = 'Confirmed'
AND NOT EXISTS (
  SELECT 1 FROM order_broadcasts ob 
  WHERE ob.order_id = o.id AND ob.vendor_id = vp.id
)
LIMIT 1
ON CONFLICT (order_id, vendor_id) DO NOTHING;