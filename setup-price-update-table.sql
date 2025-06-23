-- Create dedicated price_update_requests table
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
  CONSTRAINT price_update_requests_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendor_profiles (id),
  CONSTRAINT price_update_requests_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_update_requests_order_id ON price_update_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_price_update_requests_vendor_id ON price_update_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_price_update_requests_status ON price_update_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_update_requests_created_at ON price_update_requests(created_at);

-- Enable Row Level Security
ALTER TABLE price_update_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY IF NOT EXISTS "Allow all operations on price_update_requests" 
ON price_update_requests FOR ALL USING (true) WITH CHECK (true);

-- Add some sample data for testing
INSERT INTO price_update_requests (order_id, vendor_id, requested_price, reason, status)
SELECT 
  o.id as order_id,
  vp.id as vendor_id,
  1500.00 as requested_price,
  'Additional equipment needed for heavy items' as reason,
  'pending' as status
FROM orders o
CROSS JOIN vendor_profiles vp
WHERE o.status = 'Broadcasted' 
  AND vp.status = 'approved'
LIMIT 1
ON CONFLICT DO NOTHING;