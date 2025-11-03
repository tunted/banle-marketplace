import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Subcategory {
  id: string
  name: string
  category_id: string
}

export function useSearchAutocomplete() {
  const [suggestions, setSuggestions] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, category_id')
        .ilike('name', `%${query.trim()}%`)
        .limit(10)

      if (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } else {
        setSuggestions(data || [])
      }
    } catch (err) {
      console.error('Error in autocomplete:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          fetchSuggestions(query)
        }, 300)
      }
    })(),
    [fetchSuggestions]
  )

  const updateSearch = useCallback(
    (query: string) => {
      setSearchTerm(query)
      debouncedSearch(query)
    },
    [debouncedSearch]
  )

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setSearchTerm('')
  }, [])

  return {
    suggestions,
    loading,
    searchTerm,
    updateSearch,
    clearSuggestions,
  }
}

