-- Create tables for vendor broadcast and response tracking

-- Table to track order broadcasts to vendors
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

-- Table to track vendor responses and price updates
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

-- Add new status options to existing orders table
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