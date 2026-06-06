import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCredits() {
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setCredits(0)
      setLoading(false)
      return
    }

    fetchCredits()
  }, [user])

  const fetchCredits = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('credit_balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching credits:', error)
        setCredits(0)
      } else {
        setCredits(data?.credit_balance || 0)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
      setCredits(0)
    } finally {
      setLoading(false)
    }
  }

  const refetchCredits = () => {
    setLoading(true)
    fetchCredits()
  }

  return { credits, loading, refetchCredits }
}