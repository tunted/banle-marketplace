'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchProvinces, fetchWardsByProvince, type Province, type Ward } from '@/lib/locations'

interface LocationFilterProps {
  isOpen: boolean
  onClose: () => void
  onApply: (provinceCode: string | null, wardCode: string | null, locationName: string) => void
  currentLocation: string
}

export default function LocationFilter({
  isOpen,
  onClose,
  onApply,
  currentLocation,
}: LocationFilterProps) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedWard, setSelectedWard] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadProvinces()
      setSelectedProvince('')
      setSelectedWard('')
      setWards([])
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && selectedProvince) {
      loadWards(selectedProvince)
    } else {
      setWards([])
      setSelectedWard('')
    }
  }, [selectedProvince, isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  async function loadProvinces() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProvinces()
      setProvinces(data)
      if (data.length === 0) {
        setError('Chưa có dữ liệu tỉnh/thành phố. Vui lòng import dữ liệu vào Supabase.')
      }
    } catch (err) {
      console.error('Error loading provinces:', err)
      setError('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối database.')
    } finally {
      setLoading(false)
    }
  }

  async function loadWards(provinceCode: string) {
    setLoading(true)
    setSelectedWard('')
    setError(null)
    try {
      const data = await fetchWardsByProvince(provinceCode)
      setWards(data)
      if (data.length === 0) {
        setError('Chưa có dữ liệu quận/huyện cho tỉnh này.')
      }
    } catch (err) {
      console.error('Error loading wards:', err)
      setError('Không thể tải danh sách quận/huyện.')
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    const province = provinces.find((p) => p.code === selectedProvince)
    const ward = wards.find((w) => w.code === selectedWard)

    let locationName = 'Chọn khu vực'
    
    if (ward && province) {
      locationName = ward.name
    } else if (province) {
      locationName = province.name
    }

    onApply(
      selectedProvince || null,
      selectedWard || null,
      locationName
    )
    onClose()
  }

  function handleClear() {
    setSelectedProvince('')
    setSelectedWard('')
    setWards([])
    onApply(null, null, 'Chọn khu vực')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Chọn khu vực</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}

          {/* Province Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành phố
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value="">
                {loading ? 'Đang tải...' : provinces.length === 0 ? 'Chưa có dữ liệu' : 'Chọn tỉnh/thành phố'}
              </option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            {provinces.length === 0 && !loading && (
              <p className="mt-2 text-xs text-gray-500">
                💡 Cần import dữ liệu từ <a href="https://github.com/thanglequoc/vietnamese-provinces-database" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vietnamese-provinces-database</a>
              </p>
            )}
          </div>

          {/* Ward Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quận/Huyện/Xã
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100"
              disabled={!selectedProvince || loading}
            >
              <option value="">
                {!selectedProvince
                  ? 'Chọn tỉnh/thành phố trước'
                  : loading
                  ? 'Đang tải...'
                  : wards.length === 0
                  ? 'Chưa có dữ liệu'
                  : 'Chọn quận/huyện/xã'}
              </option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full py-3 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Áp dụng
          </button>
          <button
            onClick={handleClear}
            className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  )
}

