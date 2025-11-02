'use client'

import { useState } from 'react'

interface ListingDetailsProps {
  description: string | null
  comments: Array<{ id: string; content: string; created_at: string; user_name: string }>
  listingId: string
}

export default function ListingDetails({ description, comments: initialComments, listingId }: ListingDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const shouldExpand = description && description.length > 300
  const displayDescription = shouldExpand && !expanded 
    ? description.substring(0, 300) + '...'
    : description

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    // TODO: Implement comment submission
    // For now, just add to local state
    const comment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      user_name: 'Bạn',
    }
    setComments([...comments, comment])
    setNewComment('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Description Section */}
      {description && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mô tả chi tiết</h2>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {displayDescription}
          </div>
          {shouldExpand && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-green-600 hover:text-green-700 font-medium text-sm"
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bình luận</h2>
        
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Chưa có bình luận nào. Hãy để lại bình luận cho người bán.
          </p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-medium text-sm">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{comment.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </form>
      </div>
    </div>
  )
}

