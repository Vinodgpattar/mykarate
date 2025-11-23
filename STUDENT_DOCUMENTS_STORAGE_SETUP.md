# Student Documents Storage Setup Guide

This guide will help you set up the storage bucket for student photos and Aadhar card uploads.

## Prerequisites

- Access to Supabase Dashboard
- SQL Editor access in Supabase

## Steps

### 1. Run the Storage Bucket Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `prisma/migrations/011_create_student_documents_storage.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute

This will:
- Create the `student-documents` storage bucket
- Set up RLS policies for authenticated users to upload/update/delete
- Set up public read access for admins to view documents

### 2. Verify Bucket Creation

1. Go to **Storage** in Supabase Dashboard
2. You should see a bucket named `student-documents`
3. Click on the bucket to verify it exists
4. Check that it's set to **Public** (for easy access)

### 3. Configure Bucket Settings (Optional but Recommended)

1. Click on the `student-documents` bucket
2. Go to **Settings**
3. Set **File size limit**: 5MB (recommended)
4. Set **Allowed MIME types**: `image/jpeg`, `image/png`, `image/jpg`

## How It Works

### File Structure

- **Student Photos**: `photos/{studentId}/{timestamp}_{random}.jpg`
- **Aadhar Cards**: `aadhar/{studentId}/{timestamp}_{random}.jpg`

### Permissions

- **Students**: Can upload, update, and delete their own documents
- **Admins**: Can read all documents (public read access)
- **Public**: Can read documents (for viewing in admin panel)

## Testing

1. Log in as a student
2. Go to **Complete Profile** screen
3. Click **Upload** on Student Photo or Aadhar Card
4. Select an image from gallery or camera
5. Save the profile
6. The image should upload successfully and be visible in the profile

## Troubleshooting

### Error: "Bucket not found"
- Make sure you ran the SQL migration
- Check that the bucket name is exactly `student-documents`

### Error: "Permission denied"
- Check that the RLS policies were created correctly
- Verify the user is authenticated
- Check bucket is set to Public

### Error: "Failed to upload image"
- Check file size (should be under 5MB)
- Verify image format (JPEG/PNG)
- Check network connection
- Review Supabase logs for detailed error

### Images not displaying
- Verify bucket is set to **Public**
- Check that the URL is correct
- Ensure the file was uploaded successfully

## Next Steps

After setup, students can:
- Upload their profile photo
- Upload their Aadhar card
- Update existing images
- View their uploaded documents

Admins can:
- View all student photos and documents
- Access documents from the student profile screen

