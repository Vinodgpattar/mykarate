/**
 * API functions for admin operations that require backend
 * These operations require service role key which should not be in mobile app
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-url.com'

/**
 * Create admin user via backend API
 */
export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  branchId: string
): Promise<{ success: boolean; userId: string | null; error: Error | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        branchId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        userId: null,
        error: new Error(data.error || 'Failed to create admin user'),
      }
    }

    return {
      success: true,
      userId: data.userId,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      userId: null,
      error: error instanceof Error ? error : new Error('Failed to create admin user'),
    }
  }
}


