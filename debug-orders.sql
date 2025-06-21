-- Comprehensive SQL script to debug order data in Supabase
-- This script will show all order-related data and relationships

-- 1. Check all orders with basic info
SELECT 'ORDERS OVERVIEW' as section;
SELECT 
    id,
    user_id,
    service_type,
    status,
    pickup_address,
    drop_address,
    created_at,
    updated_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check specific order details
SELECT 'SPECIFIC ORDER DETAILS' as section;
SELECT 
    id,
    user_id,
    service_type,
    status,
    pickup_address,
    drop_address,
    pickup_pincode,
    drop_pincode,
    pickup_latitude,
    pickup_longitude,
    drop_latitude,
    drop_longitude,
    created_at
FROM orders 
WHERE id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 3. Check order_details table for the specific order
SELECT 'ORDER_DETAILS TABLE' as section;
SELECT 
    id,
    order_id,
    name,
    value,
    created_at
FROM order_details 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 4. Check common_items_in_orders table
SELECT 'COMMON_ITEMS_IN_ORDERS TABLE' as section;
SELECT 
    cio.id,
    cio.order_id,
    cio.common_item_id,
    cio.quantity,
    ci.name as item_name,
    ci.description as item_description
FROM common_items_in_orders cio
LEFT JOIN common_items ci ON cio.common_item_id = ci.id
WHERE cio.order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 5. Check custom_items table
SELECT 'CUSTOM_ITEMS TABLE' as section;
SELECT 
    id,
    order_id,
    name,
    description,
    quantity,
    created_at
FROM custom_items 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 6. Check order_question_answers table
SELECT 'ORDER_QUESTION_ANSWERS TABLE' as section;
SELECT 
    oqa.id,
    oqa.order_id,
    oqa.question_id,
    oqa.answer,
    sq.question as question_text,
    sq.question_type
FROM order_question_answers oqa
LEFT JOIN service_questions sq ON oqa.question_id = sq.id
WHERE oqa.order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 7. Check item_photos table
SELECT 'ITEM_PHOTOS TABLE' as section;
SELECT 
    ip.id,
    ip.custom_item_id,
    ip.photo_url,
    ci.name as item_name,
    ci.order_id
FROM item_photos ip
LEFT JOIN custom_items ci ON ip.custom_item_id = ci.id
WHERE ci.order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 8. Count all related records for this order
SELECT 'RECORD COUNTS FOR ORDER' as section;
SELECT 
    'order_details' as table_name,
    COUNT(*) as record_count
FROM order_details 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158'
UNION ALL
SELECT 
    'common_items_in_orders' as table_name,
    COUNT(*) as record_count
FROM common_items_in_orders 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158'
UNION ALL
SELECT 
    'custom_items' as table_name,
    COUNT(*) as record_count
FROM custom_items 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158'
UNION ALL
SELECT 
    'order_question_answers' as table_name,
    COUNT(*) as record_count
FROM order_question_answers 
WHERE order_id = '696e34d2-9456-4f75-b5ba-30a8a0d52158';

-- 9. Check all tables structure to verify column names
SELECT 'TABLE STRUCTURES' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('orders', 'order_details', 'common_items_in_orders', 'custom_items', 'order_question_answers', 'item_photos')
ORDER BY table_name, ordinal_position;

-- 10. Check for any data in these tables at all
SELECT 'GENERAL TABLE COUNTS' as section;
SELECT 
    'orders' as table_name,
    COUNT(*) as total_records
FROM orders
UNION ALL
SELECT 
    'order_details' as table_name,
    COUNT(*) as total_records
FROM order_details
UNION ALL
SELECT 
    'common_items_in_orders' as table_name,
    COUNT(*) as total_records
FROM common_items_in_orders
UNION ALL
SELECT 
    'custom_items' as table_name,
    COUNT(*) as total_records
FROM custom_items
UNION ALL
SELECT 
    'order_question_answers' as table_name,
    COUNT(*) as total_records
FROM order_question_answers
UNION ALL
SELECT 
    'item_photos' as table_name,
    COUNT(*) as total_records
FROM item_photos;

-- 11. Test the test order I created
SELECT 'TEST ORDER DATA' as section;
SELECT 
    'order_details' as table_name,
    COUNT(*) as record_count
FROM order_details 
WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b'
UNION ALL
SELECT 
    'common_items_in_orders' as table_name,
    COUNT(*) as record_count
FROM common_items_in_orders 
WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b'
UNION ALL
SELECT 
    'custom_items' as table_name,
    COUNT(*) as record_count
FROM custom_items 
WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b'
UNION ALL
SELECT 
    'order_question_answers' as table_name,
    COUNT(*) as record_count
FROM order_question_answers 
WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b';

-- 12. Show actual data from test order
SELECT 'TEST ORDER DETAILS' as section;
SELECT * FROM order_details WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b';

SELECT 'TEST ORDER CUSTOM ITEMS' as section;
SELECT * FROM custom_items WHERE order_id = 'f606bced-ade2-4010-9f6f-e801fff3e29b';