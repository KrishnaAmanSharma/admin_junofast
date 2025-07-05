-- Fix database schema to resolve foreign key relationship errors
-- This SQL script will add the missing foreign key constraints

-- Add foreign key constraint for orders.user_id -> profiles.id
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Add foreign key constraint for common_items.service_type_id -> service_types.id
ALTER TABLE common_items 
ADD CONSTRAINT common_items_service_type_id_fkey 
FOREIGN KEY (service_type_id) REFERENCES service_types(id);

-- Add foreign key constraint for service_questions.service_type_id -> service_types.id
ALTER TABLE service_questions 
ADD CONSTRAINT service_questions_service_type_id_fkey 
FOREIGN KEY (service_type_id) REFERENCES service_types(id);

-- Add foreign key constraint for common_items_in_orders.order_id -> orders.id
ALTER TABLE common_items_in_orders 
ADD CONSTRAINT common_items_in_orders_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id);

-- Add foreign key constraint for common_items_in_orders.item_id -> common_items.id
ALTER TABLE common_items_in_orders 
ADD CONSTRAINT common_items_in_orders_item_id_fkey 
FOREIGN KEY (item_id) REFERENCES common_items(id);

-- Add foreign key constraint for custom_items.order_id -> orders.id
ALTER TABLE custom_items 
ADD CONSTRAINT custom_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id);

-- Add foreign key constraint for order_question_answers.order_id -> orders.id
ALTER TABLE order_question_answers 
ADD CONSTRAINT order_question_answers_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id);

-- Add foreign key constraint for item_photos.custom_item_id -> custom_items.id
ALTER TABLE item_photos 
ADD CONSTRAINT item_photos_custom_item_id_fkey 
FOREIGN KEY (custom_item_id) REFERENCES custom_items(id);

-- Add foreign key constraint for order_details.order_id -> orders.id
ALTER TABLE order_details 
ADD CONSTRAINT order_details_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id);

-- Add payments table for vendor/order payments
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  total_due numeric NOT NULL,
  total_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add payment transactions table for history
CREATE TABLE IF NOT EXISTS public.order_payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid NOT NULL REFERENCES public.order_payments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('payment', 'refund')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add customer_price to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_price numeric;

-- Atomic function to add payment transaction and update total_paid
create or replace function public.add_order_payment_transaction_atomic(
  payment_id uuid,
  amount numeric,
  transaction_type text,
  notes text default null
)
returns void as $$
begin
  -- Insert the transaction
  insert into public.order_payment_transactions (payment_id, amount, transaction_type, notes, created_at)
  values (payment_id, amount, transaction_type, notes, now());

  -- Update the total_paid in order_payments
  update public.order_payments
  set total_paid = coalesce((
    select sum(
      case
        when t.transaction_type = 'payment' then t.amount
        when t.transaction_type = 'refund' then -t.amount
        else 0
      end
    )
    from public.order_payment_transactions t
    where t.payment_id = public.order_payments.id
  ), 0)
  where id = payment_id;
end;
$$ language plpgsql;

-- Atomic function to approve vendor, update order, upsert payment, and update broadcast
create or replace function public.approve_vendor_and_create_payment_atomic(
  p_order_id uuid,
  p_vendor_id uuid,
  p_response_id uuid,
  p_customer_price numeric,
  p_approx_price numeric
)
returns void as $$
begin
  -- 1. Approve the vendor response
  update vendor_responses
  set admin_approved = true,
      admin_response = 'Vendor approved and assigned to order',
      reviewed_at = now()
  where id = p_response_id;

  -- 2. Update the order with vendor assignment, status, and prices
  update orders
  set status = 'Confirmed',
      vendor_id = p_vendor_id,
      customer_price = p_customer_price,
      approx_price = p_approx_price
  where id = p_order_id;

  -- 3. Upsert payment record for this vendor/order
  insert into order_payments (order_id, vendor_id, total_due, updated_at)
  values (p_order_id, p_vendor_id, p_approx_price, now())
  on conflict (order_id, vendor_id)
  do update set total_due = excluded.total_due, updated_at = now();

  -- 4. Update order_broadcasts status to accepted
  update order_broadcasts
  set status = 'accepted',
      response_at = now()
  where order_id = p_order_id and vendor_id = p_vendor_id;
end;
$$ language plpgsql;