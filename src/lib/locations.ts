import { supabase } from './supabase'

export interface Province {
  code: string
  name: string
  name_en: string
  full_name: string
  full_name_en: string
  code_name: string
  administrative_unit_id: number
}

export interface Ward {
  code: string
  name: string
  name_en: string
  full_name: string
  full_name_en: string
  code_name: string
  province_code: string
  administrative_unit_id: number
}

/**
 * Fetch all provinces from Supabase
 */
export async function fetchProvinces(): Promise<Province[]> {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching provinces:', error)
    return []
  }

  return data || []
}

/**
 * Fetch wards by province code
 */
export async function fetchWardsByProvince(provinceCode: string): Promise<Ward[]> {
  if (!provinceCode) return []

  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .eq('province_code', provinceCode)
    .order('name')

  if (error) {
    console.error('Error fetching wards:', error)
    return []
  }

  return data || []
}

