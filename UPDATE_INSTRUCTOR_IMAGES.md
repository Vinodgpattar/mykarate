# How to Set Instructor Image URLs

## Step 1: Upload Images to Supabase Storage

1. Go to **Supabase Dashboard** → **Storage** → **public-assets** bucket
2. Navigate to each instructor folder:
   - `instructors/rajesh-yaragatti/`
   - `instructors/pradeep-kumar/`
   - `instructors/chinmayee-yaragatti/`
   - `instructors/munaf-kanwar/`
3. Upload `profile.jpeg` to each folder (400×400px, < 200KB)

## Step 2: Get Public URLs

For each uploaded image:

1. Click on the image file in Supabase Storage
2. Click the **"Get URL"** button (or copy the Public URL shown)
3. Copy the full URL (it will look like: `https://your-project.supabase.co/storage/v1/object/public/public-assets/instructors/rajesh-yaragatti/profile.jpeg`)

## Step 3: Update Database

### Option A: Use Supabase SQL Editor (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy and paste the SQL script below
4. Replace `YOUR_PUBLIC_URL_HERE` with the actual URLs you copied
5. Click **"Run"**

```sql
-- Update Rajesh B Yaragatti
UPDATE instructors 
SET profile_image_url = 'YOUR_PUBLIC_URL_HERE'
WHERE name = 'Rajesh B Yaragatti';

-- Update Pradeep Kumar
UPDATE instructors 
SET profile_image_url = 'YOUR_PUBLIC_URL_HERE'
WHERE name = 'Pradeep Kumar';

-- Update Chinmayee R. Yaragatti
UPDATE instructors 
SET profile_image_url = 'YOUR_PUBLIC_URL_HERE'
WHERE name = 'Chinmayee R. Yaragatti';

-- Update Munaf S. Kanwar
UPDATE instructors 
SET profile_image_url = 'YOUR_PUBLIC_URL_HERE'
WHERE name = 'Munaf S. Kanwar';
```

### Option B: Use the SQL File

1. Open `prisma/migrations/021_update_instructor_images.sql` (if it exists)
2. Replace the placeholder URLs with your actual URLs
3. Run it in Supabase SQL Editor

## Step 4: Verify

After updating, verify the URLs are set:

```sql
SELECT name, profile_image_url 
FROM instructors 
ORDER BY order_index;
```

All `profile_image_url` values should show your Supabase Storage URLs.

## Quick Example

If your Supabase project URL is `https://xbqsjvceqagbtijyfrpj.supabase.co`, your URLs would look like:

```sql
UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/rajesh-yaragatti/profile.jpeg'
WHERE name = 'Rajesh B Yaragatti';

UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/pradeep-kumar/profile.jpeg'
WHERE name = 'Pradeep Kumar';

UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/chinmayee-yaragatti/profile.jpeg'
WHERE name = 'Chinmayee R. Yaragatti';

UPDATE instructors 
SET profile_image_url = 'https://xbqsjvceqagbtijyfrpj.supabase.co/storage/v1/object/public/public-assets/instructors/munaf-kanwar/profile.jpeg'
WHERE name = 'Munaf S. Kanwar';
```

## Notes

- Make sure the `public-assets` bucket is **Public** (anyone can read)
- Image files should be named exactly `profile.jpeg` in each folder
- The URLs will be automatically used by the app once updated in the database
- You can update URLs anytime by running the UPDATE statements again

