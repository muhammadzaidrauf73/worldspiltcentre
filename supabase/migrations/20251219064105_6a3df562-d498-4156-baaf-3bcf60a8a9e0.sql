
-- Make user_id nullable to allow admin-created sample reviews
ALTER TABLE product_reviews ALTER COLUMN user_id DROP NOT NULL;
