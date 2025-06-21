SELECT
  o.*,
  -- Order details as JSON array
  COALESCE(
    (
      SELECT json_agg(od)
      FROM order_details od
      WHERE od.order_id = o.id
    ), '[]'
  ) AS order_details,
  -- Common items as JSON array
  COALESCE(
    (
      SELECT json_agg(ci)
      FROM common_items_in_orders ci
      WHERE ci.order_id = o.id
    ), '[]'
  ) AS common_items,
  -- Custom items as JSON array, including their photos
  COALESCE(
    (
      SELECT json_agg(
        jsonb_set(
          to_jsonb(cu),
          '{photos}',
          COALESCE(
            (
              SELECT json_agg(ip.photo_url)
              FROM item_photos ip
              WHERE ip.custom_item_id = cu.id
            )::jsonb,
            '[]'::jsonb
          )
        )
      )
      FROM custom_items cu
      WHERE cu.order_id = o.id
    ), '[]'
  ) AS custom_items,
  -- Question answers as JSON array
  COALESCE(
    (
      SELECT json_agg(qa)
      FROM order_question_answers qa
      WHERE qa.order_id = o.id
    ), '[]'
  ) AS question_answers
FROM orders o
ORDER BY o.created_at DESC
LIMIT 5;