-- Function to update category product counts
CREATE OR REPLACE FUNCTION public.update_category_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.category_id IS NOT NULL AND NEW.is_active = true THEN
      UPDATE categories 
      SET product_count = (
        SELECT COUNT(*) FROM products 
        WHERE category_id = NEW.category_id AND is_active = true
      )
      WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories 
      SET product_count = (
        SELECT COUNT(*) FROM products 
        WHERE category_id = OLD.category_id AND is_active = true
      )
      WHERE id = OLD.category_id;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If category changed or is_active changed, update both old and new categories
    IF OLD.category_id IS DISTINCT FROM NEW.category_id OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      -- Update old category count
      IF OLD.category_id IS NOT NULL THEN
        UPDATE categories 
        SET product_count = (
          SELECT COUNT(*) FROM products 
          WHERE category_id = OLD.category_id AND is_active = true
        )
        WHERE id = OLD.category_id;
      END IF;
      
      -- Update new category count
      IF NEW.category_id IS NOT NULL THEN
        UPDATE categories 
        SET product_count = (
          SELECT COUNT(*) FROM products 
          WHERE category_id = NEW.category_id AND is_active = true
        )
        WHERE id = NEW.category_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger on products table
DROP TRIGGER IF EXISTS trigger_update_category_product_count ON products;
CREATE TRIGGER trigger_update_category_product_count
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION public.update_category_product_count();

-- Initialize all category counts with current product counts
UPDATE categories c
SET product_count = (
  SELECT COUNT(*) FROM products p 
  WHERE p.category_id = c.id AND p.is_active = true
);