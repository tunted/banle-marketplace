'use client'

import Link from 'next/link'

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tin nhắn</h1>
          <p className="text-gray-600 mb-6">Tính năng tin nhắn đang được phát triển. Sẽ có sớm!</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

