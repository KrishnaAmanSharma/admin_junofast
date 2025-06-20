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