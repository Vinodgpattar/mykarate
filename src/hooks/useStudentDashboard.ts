import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getStudentByUserId, type StudentWithBranch } from '@/lib/students'
import { getStudentAttendanceStats, getStudentAttendance, type AttendanceStats, type AttendanceRecord } from '@/lib/attendance'
import { getStudentFees, type StudentFee } from '@/lib/fees'
import { getStudentNotifications, getUnreadCount, type StudentNotification } from '@/lib/student-notifications'
import { logger } from '@/lib/logger'

interface StudentDashboardData {
  student: StudentWithBranch | null
  attendanceStats: AttendanceStats | null
  feeStats: {
    pending: number
    overdue: number
    paid: number
    totalPending: number
    totalOverdue: number
  }
  profileCompletion: number
  recentAttendance: AttendanceRecord[]
  recentFees: StudentFee[]
  recentNotification: StudentNotification | null
  unreadCount: number
}

export function useStudentDashboard(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [data, setData] = useState<StudentDashboardData>({
    student: null,
    attendanceStats: null,
    feeStats: {
      pending: 0,
      overdue: 0,
      paid: 0,
      totalPending: 0,
      totalOverdue: 0,
    },
    profileCompletion: 0,
    recentAttendance: [],
    recentFees: [],
    recentNotification: null,
    unreadCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isLoadingRef = useRef(false)

  const calculateProfileCompletion = (student: StudentWithBranch | null): number => {
    if (!student) return 0
    const fields = [
      student.date_of_birth,
      student.gender,
      student.address,
      student.aadhar_number,
      student.student_photo_url,
      student.aadhar_card_url,
      student.parent_name,
      student.emergency_contact_name,
    ]
    const completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }

  const calculateFeeStats = (fees: StudentFee[]) => {
    const pending = fees.filter((f) => f.status === 'pending').length
    const overdue = fees.filter((f) => f.status === 'overdue').length
    const paid = fees.filter((f) => f.status === 'paid').length
    
    const totalPending = fees
      .filter((f) => f.status === 'pending')
      .reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0)
    
    const totalOverdue = fees
      .filter((f) => f.status === 'overdue')
      .reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0)

    return {
      pending,
      overdue,
      paid,
      totalPending,
      totalOverdue,
    }
  }

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      return
    }

    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      // First, get the student to get their student ID
      const studentResult = await getStudentByUserId(userId)
      
      if (studentResult.error || !studentResult.student) {
        logger.error('Error fetching student data', studentResult.error || new Error('Student not found'))
        setError(studentResult.error || new Error('Student not found'))
        setLoading(false)
        setRefreshing(false)
        return
      }

      const student = studentResult.student
      const studentId = student.id

      // Calculate date range for streak calculation (last 60 days)
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 60)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Calculate 24 hours ago timestamp
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      // Now fetch all other data using the student ID
      const [attendanceStatsResult, feesResult, attendanceRecordsResult, notificationsResult, unreadCountResult] = await Promise.all([
        getStudentAttendanceStats(studentId, startDateStr, endDate), // Fetch last 60 days for accurate streak
        getStudentFees(studentId),
        getStudentAttendance(studentId, { limit: 5 }), // Recent records for display
        getStudentNotifications({ limit: 10 }), // Get recent notifications
        getUnreadCount(), // Get unread count
      ])

      if (attendanceStatsResult.error) {
        logger.error('Error fetching attendance stats', attendanceStatsResult.error)
      }

      if (feesResult.error) {
        logger.error('Error fetching fees', feesResult.error)
      }

      if (attendanceRecordsResult.error) {
        logger.error('Error fetching attendance records', attendanceRecordsResult.error)
      }

      if (notificationsResult.error) {
        logger.error('Error fetching notifications', notificationsResult.error)
      }

      if (unreadCountResult.error) {
        logger.error('Error fetching unread count', unreadCountResult.error)
      }

      const attendanceStats = attendanceStatsResult.stats
      const fees = feesResult.fees || []
      const recentAttendance = attendanceRecordsResult.records || []
      const notifications = notificationsResult.notifications || []
      const unreadCount = unreadCountResult.count || 0
      
      // Get recent fees (last 5)
      const recentFees = fees.slice(0, 5)

      // Find the most recent notification from the last 24 hours
      // Sort notifications by date (most recent first) and find the first one within 24 hours
      const recentNotification = notifications
        .filter((n) => {
          if (!n.createdAt) return false
          const notificationDate = new Date(n.createdAt)
          return notificationDate >= twentyFourHoursAgo
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA // Most recent first
        })[0] || null

      const profileCompletion = calculateProfileCompletion(student)
      const feeStats = calculateFeeStats(fees)

      setData({
        student,
        attendanceStats,
        feeStats,
        profileCompletion,
        recentAttendance,
        recentFees,
        recentNotification,
        unreadCount,
      })
    } catch (err) {
      logger.error('useStudentDashboard: Error loading data', err as Error)
      setError(err as Error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      isLoadingRef.current = false
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId, loadData])

  const onRefresh = useCallback(async () => {
    if (isLoadingRef.current || refreshing) {
      return
    }
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      await loadData()
    } catch (err) {
      logger.error('Error refreshing dashboard', err as Error)
      setRefreshing(false)
    }
  }, [queryClient, loadData]) // Removed 'refreshing' from dependencies to prevent recreation

  return {
    ...data,
    loading,
    refreshing,
    error,
    onRefresh,
  }
}

