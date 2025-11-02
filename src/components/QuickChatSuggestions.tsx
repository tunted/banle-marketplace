'use client'

interface QuickChatSuggestionsProps {
  listingId: string
}

export default function QuickChatSuggestions({ listingId }: QuickChatSuggestionsProps) {
  const suggestions = [
    'Điện thoại này còn không?',
    'Bạn có ship hàng không?',
    'Sản phẩm còn bảo hành không?',
  ]

  const handleSuggestionClick = (suggestion: string) => {
    // TODO: Implement chat functionality
    console.log('Sending message:', suggestion)
    // This could open a chat modal or redirect to chat page
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">Câu hỏi nhanh</p>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}

