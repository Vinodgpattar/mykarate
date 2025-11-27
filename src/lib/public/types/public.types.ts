// TypeScript types for public view

export interface Instructor {
  id: string
  name: string
  title: string | null
  belt_rank: string | null
  description: string | null
  profile_image_url: string | null
  gallery_urls: string[] | null
  video_urls: string[] | null
  experience_years: number | null
  specialization: string | null
  is_featured: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface PublicGalleryItem {
  id: string
  media_type: 'image' | 'video'
  title: string | null
  file_url: string
  thumbnail_url: string | null
  order_index: number
  is_featured: boolean
  is_active: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  name: string
  code: string | null
  address: string | null
  phone: string | null
  email: string | null
  status: string
}

export interface PublicData {
  branches: Branch[]
  instructors: Instructor[]
  studentCount: number
  galleryItems: PublicGalleryItem[]
  logoUrl: string | null
}

