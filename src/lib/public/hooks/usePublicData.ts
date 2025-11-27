import { useState, useEffect } from 'react'
import { getPublicData } from '../services/publicDataService'
import type { PublicData } from '../types/public.types'

export function usePublicData() {
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const result = await getPublicData()

        if (cancelled) return

        if (result.error) {
          setError(result.error)
          setData(null)
        } else {
          setData(result.data)
          setError(null)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error('Failed to load data'))
        setData(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [])

  const refetch = async () => {
    setLoading(true)
    setError(null)

    const result = await getPublicData()

    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data)
    }

    setLoading(false)
  }

  return { data, loading, error, refetch }
}

