import { supabaseAdmin } from './supabase'
import { logger } from './logger'

export interface StorageBucketInfo {
  id: string
  name: string
  public: boolean
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

export interface StorageUsage {
  bucketId: string
  bucketName: string
  fileCount: number
  totalSize: number // in bytes
  totalSizeMB: number // in MB
  totalSizeGB: number // in GB
  percentageOfLimit?: number // percentage of 500MB free tier
}

export interface StorageSummary {
  totalSize: number // in bytes
  totalSizeMB: number // in MB
  totalSizeGB: number // in GB
  totalFiles: number
  buckets: StorageUsage[]
  freeTierLimit: number // 500MB in bytes
  usagePercentage: number // percentage of 500MB free tier
  remainingSpace: number // in bytes
  remainingSpaceMB: number // in MB
  status: 'healthy' | 'warning' | 'critical' // healthy < 70%, warning 70-90%, critical > 90%
}

const FREE_TIER_LIMIT = 500 * 1024 * 1024 // 500MB in bytes

/**
 * Get storage usage for a specific bucket
 */
async function getBucketUsage(bucketId: string): Promise<StorageUsage | null> {
  try {
    if (!supabaseAdmin) {
      logger.error('Storage monitoring: Service role key not configured')
      return null
    }

    // List all files in the bucket
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucketId)
      .list('', {
        limit: 10000, // Max files to check (Supabase limit)
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      logger.error(`Error listing files in bucket ${bucketId}`, error as Error)
      return null
    }

    // Calculate total size
    let totalSize = 0
    let fileCount = 0

    if (files && files.length > 0) {
      // Get file sizes
      for (const file of files) {
        if (file.metadata && file.metadata.size) {
          totalSize += parseInt(file.metadata.size, 10) || 0
          fileCount++
        } else if ('size' in file && file.size) {
          totalSize += (file.size as number)
          fileCount++
        }
      }

      // If there are more files, we need to paginate
      // For now, we'll estimate based on average file size
      if (files.length === 10000) {
        logger.warn(`Bucket ${bucketId} has more than 10000 files, usage may be underestimated`)
      }
    }

    const totalSizeMB = totalSize / (1024 * 1024)
    const totalSizeGB = totalSizeMB / 1024
    const percentageOfLimit = (totalSize / FREE_TIER_LIMIT) * 100

    return {
      bucketId,
      bucketName: bucketId,
      fileCount,
      totalSize,
      totalSizeMB,
      totalSizeGB,
      percentageOfLimit,
    }
  } catch (error) {
    logger.error(`Unexpected error getting bucket usage for ${bucketId}`, error as Error)
    return null
  }
}

/**
 * Get storage usage summary for all buckets
 */
export async function getStorageSummary(): Promise<StorageSummary | null> {
  try {
    if (!supabaseAdmin) {
      logger.error('Storage monitoring: Service role key not configured')
      return null
    }

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      logger.error('Error listing storage buckets', bucketsError as Error)
      return null
    }

    if (!buckets || buckets.length === 0) {
      return {
        totalSize: 0,
        totalSizeMB: 0,
        totalSizeGB: 0,
        totalFiles: 0,
        buckets: [],
        freeTierLimit: FREE_TIER_LIMIT,
        usagePercentage: 0,
        remainingSpace: FREE_TIER_LIMIT,
        remainingSpaceMB: 500,
        status: 'healthy',
      }
    }

    // Get usage for each bucket
    const bucketUsages: StorageUsage[] = []
    let totalSize = 0
    let totalFiles = 0

    for (const bucket of buckets) {
      const usage = await getBucketUsage(bucket.id)
      if (usage) {
        bucketUsages.push(usage)
        totalSize += usage.totalSize
        totalFiles += usage.fileCount
      }
    }

    const totalSizeMB = totalSize / (1024 * 1024)
    const totalSizeGB = totalSizeMB / 1024
    const usagePercentage = (totalSize / FREE_TIER_LIMIT) * 100
    const remainingSpace = FREE_TIER_LIMIT - totalSize
    const remainingSpaceMB = remainingSpace / (1024 * 1024)

    // Determine status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (usagePercentage >= 90) {
      status = 'critical'
    } else if (usagePercentage >= 70) {
      status = 'warning'
    }

    return {
      totalSize,
      totalSizeMB,
      totalSizeGB,
      totalFiles,
      buckets: bucketUsages,
      freeTierLimit: FREE_TIER_LIMIT,
      usagePercentage,
      remainingSpace,
      remainingSpaceMB,
      status,
    }
  } catch (error) {
    logger.error('Unexpected error getting storage summary', error as Error)
    return null
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get storage usage for a specific bucket (public API)
 */
export async function getBucketStorageUsage(bucketId: string): Promise<StorageUsage | null> {
  return getBucketUsage(bucketId)
}

