import { supabase } from './supabase'
import { logger } from './logger'
import { getStudentByUserId } from './students'

/**
 * Generate secure random token for password reset
 */
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Request password reset - Generate token and send email
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Check if service role key is available
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        error: new Error('Service role key not configured'),
      }
    }

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      logger.error('Error listing users', listError)
      return {
        success: false,
        error: new Error('Failed to find user'),
      }
    }

    const user = users?.find((u: any) => u.email === normalizedEmail)
    if (!user) {
      // Don't reveal if email exists (security)
      logger.warn('Password reset requested for non-existent email', { email: normalizedEmail })
      // Return success anyway to prevent email enumeration
      return { success: true, error: null }
    }

    // Check if student exists and is active
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      // Not a student, don't allow reset
      return { success: true, error: null } // Don't reveal
    }

    // Generate token
    const token = generateResetToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiration

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
        used: false,
      })

    if (tokenError) {
      logger.error('Error storing reset token', tokenError as Error)
      return {
        success: false,
        error: new Error('Failed to create reset token'),
      }
    }

    // Get student info for email
    const studentResult = await getStudentByUserId(user.id)
    const studentName = studentResult.student
      ? `${studentResult.student.first_name} ${studentResult.student.last_name}`
      : 'Student'

    // Generate reset link
    const resetLink = `karate-dojo://reset-password?token=${token}`
    // Alternative web link if needed:
    // const resetLink = `${process.env.EXPO_PUBLIC_APP_URL}/reset-password?token=${token}`

    // Send reset email
    try {
      const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL || 'https://your-vercel-app.vercel.app'
      const emailResponse = await fetch(`${emailApiUrl}/api/email/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: studentName,
          resetLink,
          expiresIn: '1 hour',
        }),
      })

      if (!emailResponse.ok) {
        logger.warn('Failed to send password reset email', new Error('Email API returned error'))
      }
    } catch (emailError) {
      logger.warn('Failed to send password reset email', emailError as Error)
      // Don't fail the operation if email fails
    }

    logger.info('Password reset requested', { email: normalizedEmail })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error requesting password reset', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to request password reset'),
    }
  }
}

/**
 * Validate reset token
 */
export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; userId: string | null; error: null } | { valid: false; userId: null; error: Error }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        valid: false,
        userId: null,
        error: new Error('Service role key not configured'),
      }
    }

    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .single()

    if (error || !data) {
      return {
        valid: false,
        userId: null,
        error: new Error('Invalid reset token'),
      }
    }

    // Check if token is used
    if (data.used) {
      return {
        valid: false,
        userId: null,
        error: new Error('This reset link has already been used'),
      }
    }

    // Check if token is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return {
        valid: false,
        userId: null,
        error: new Error('Reset link has expired'),
      }
    }

    return {
      valid: true,
      userId: data.user_id,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error validating reset token', error as Error)
    return {
      valid: false,
      userId: null,
      error: error instanceof Error ? error : new Error('Failed to validate token'),
    }
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // Validate token
    const validation = await validateResetToken(token)
    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        error: validation.error || new Error('Invalid token'),
      }
    }

    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        error: new Error('Service role key not configured'),
      }
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        error: new Error('Password must be at least 8 characters'),
      }
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(validation.userId, {
      password: newPassword,
    })

    if (updateError) {
      logger.error('Error updating password', updateError)
      return {
        success: false,
        error: new Error('Failed to update password: ' + updateError.message),
      }
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token)

    // Get student info for confirmation email
    const studentResult = await getStudentByUserId(validation.userId)
    const studentEmail = studentResult.student?.email || ''

    // Send confirmation email
    try {
      const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL || 'https://your-vercel-app.vercel.app'
      await fetch(`${emailApiUrl}/api/email/send-password-reset-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentEmail,
        }),
      })
    } catch (emailError) {
      logger.warn('Failed to send confirmation email', emailError as Error)
      // Don't fail the operation if email fails
    }

    logger.info('Password reset successful', { userId: validation.userId })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error resetting password', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to reset password'),
    }
  }
}

/**
 * Cleanup expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) return

    // Delete expired tokens
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .or(`expires_at.lt.${new Date().toISOString()},and(used.eq.true,used_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()})`)

    logger.info('Expired tokens cleaned up')
  } catch (error) {
    logger.warn('Failed to cleanup expired tokens', error as Error)
  }
}

