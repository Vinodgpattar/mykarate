# Public View Storage Setup Guide

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `public-assets`
4. **Make it Public** (toggle "Public bucket" to ON)
5. Click **"Create bucket"**

## Step 2: Create Folder Structure

Inside the `public-assets` bucket, create these folders:

```
public-assets/
├── logo/
├── instructors/
│   ├── pradeep-kumar/
│   ├── rajesh-yaragatti/
│   ├── chinmayee-yaragatti/
│   └── munaf-kanwar/
└── public-gallery/
```

**How to create folders:**
- Click on `public-assets` bucket
- Click **"New folder"** or upload a file to create the path automatically

## Step 3: Upload Images

### Hero Image (Pradeep Kumar sir)
- **Path:** `instructors/pradeep-kumar/hero-image.jpeg`
- **Size:** 1920×1080px (16:9 aspect ratio)
- **File size:** < 500KB
- **Format:** JPEG

### Instructor Profile Images
Upload profile images for each instructor:

1. **Rajesh B Yaragatti**
   - **Path:** `instructors/rajesh-yaragatti/profile.jpeg`
   - **Size:** 400×400px (square)
   - **File size:** < 200KB
   - **Format:** JPEG

2. **Pradeep Kumar**
   - **Path:** `instructors/pradeep-kumar/profile.jpeg`
   - **Size:** 400×400px (square)
   - **File size:** < 200KB
   - **Format:** JPEG

3. **Chinmayee R. Yaragatti**
   - **Path:** `instructors/chinmayee-yaragatti/profile.jpeg`
   - **Size:** 400×400px (square)
   - **File size:** < 200KB
   - **Format:** JPEG

4. **Munaf S. Kanwar**
   - **Path:** `instructors/munaf-kanwar/profile.jpeg`
   - **Size:** 400×400px (square)
   - **File size:** < 200KB
   - **Format:** JPEG

### Logo
- **Path:** `logo/dojo-logo.jpg` (or `.jpeg`)
- **Size:** 512×512px (square)
- **File size:** < 100KB
- **Format:** JPEG (or PNG with transparent background)

## Step 4: Update Database with Image URLs

After uploading images, get the public URLs and update the database:

1. Click on each uploaded image
2. Copy the **Public URL**
3. Run these SQL commands in Supabase SQL Editor:

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

## Step 5: Set Storage Policies (RLS)

The bucket should already be public, but verify:

1. Go to **Storage** → **Policies** tab
2. For `public-assets` bucket:
   - **Public read access** should be enabled
   - **Upload access** should be restricted to authenticated admins only

## Notes

- **File size limits:** Keep images optimized to save storage space
- **Image optimization:** Use tools like TinyPNG or ImageOptim before uploading
- **Gallery uploads:** Will be handled through admin panel (to be built later)

