import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getBranches, type Branch } from '@/lib/branches'
import { getStudentStatistics } from '@/lib/students'

interface StudentStats {
  total: number
  active: number
  inactive: number
  profileCompleted: number
  profileIncomplete: number
}

export function useAdminDashboard() {
  const queryClient = useQueryClient()
  const [branches, setBranches] = useState<Branch[]>([])
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [branchesResult, studentStatsResult] = await Promise.all([
        getBranches(),
        getStudentStatistics(),
      ])

      if (branchesResult.branches) {
        setBranches(branchesResult.branches as Branch[])
      }

      if (!studentStatsResult.error) {
        setStudentStats({
          total: studentStatsResult.total,
          active: studentStatsResult.active,
          inactive: studentStatsResult.inactive,
          profileCompleted: studentStatsResult.profileCompleted,
          profileIncomplete: studentStatsResult.profileIncomplete,
        })
      } else if (studentStatsResult.error) {
        setError(studentStatsResult.error)
      }
    } catch (err) {
      console.error('useAdminDashboard: Error loading data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['branches'] })
    await loadData()
  }

  return {
    branches,
    studentStats,
    loading,
    refreshing,
    error,
    onRefresh,
    reload: loadData,
  }
}


