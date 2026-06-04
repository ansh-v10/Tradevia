-- Create the admin whitelist table if it does not already exist.
CREATE TABLE IF NOT EXISTS public.admins (
  email text PRIMARY KEY
);

-- Add your admin email here before using the admin panel.
-- Replace the placeholder email with the exact Supabase Auth email you will sign in with.
INSERT INTO public.admins (email)
VALUES ('your-admin-email@example.com')
ON CONFLICT (email) DO NOTHING;

-- Optional: verify the table contents.
SELECT * FROM public.admins ORDER BY email;
