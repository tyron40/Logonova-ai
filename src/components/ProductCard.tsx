import React from 'react'
import { CreditCard, Coins } from 'lucide-react'
import { StripeProduct } from '../stripe-config'

interface ProductCardProps {
  product: StripeProduct
  onPurchase: (priceId: string) => void
  loading?: boolean
  disabled?: boolean
}

export function ProductCard({ product, onPurchase, loading = false, disabled = false }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {product.credits ? (
            <Coins className="w-6 h-6 text-yellow-500" />
          ) : (
            <CreditCard className="w-6 h-6 text-blue-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">USD</div>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 capitalize">{product.description}</p>
      
      {product.credits && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-md">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {product.credits} Credits
            </span>
          </div>
        </div>
      )}
      
      <button
        onClick={() => onPurchase(product.priceId)}
        disabled={disabled || loading}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          disabled || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          'Purchase Now'
        )}
      </button>
    </div>
  )
}