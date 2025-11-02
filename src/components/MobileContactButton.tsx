'use client'

interface MobileContactButtonProps {
  phone: string
}

export default function MobileContactButton({ phone }: MobileContactButtonProps) {
  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone
    const lastFour = phone.slice(-4)
    const masked = phone.slice(0, -4).replace(/./g, '*')
    return masked + lastFour
  }

  return (
    <div className="fixed bottom-6 left-4 right-4 lg:hidden z-50">
      <div className="bg-white rounded-full shadow-lg p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Liên hệ</p>
          <p className="font-bold text-gray-900">{maskPhone(phone)}</p>
        </div>
        <a
          href={`tel:${phone}`}
          className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition-colors"
        >
          Gọi ngay
        </a>
      </div>
    </div>
  )
}

