-- Fix order status constraint to include 'Assigned' status
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
DROP CONSTRAINT orders_status_check;

ALTER TABLE orders 
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
]));