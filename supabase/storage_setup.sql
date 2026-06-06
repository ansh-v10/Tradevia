-- Run this in Supabase SQL Editor AFTER creating the bucket via Dashboard:
-- 1. Go to Storage → Create bucket → name: "product-images", Public bucket: ON

-- Allow public read access to product-images bucket objects
CREATE POLICY "product_images_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users (admins) to upload to product-images
CREATE POLICY "product_images_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users (admins) to update their uploads
CREATE POLICY "product_images_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users (admins) to delete
CREATE POLICY "product_images_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
