import React, { useState } from 'react'
import { ProductCard } from './ProductCard'
import { stripeProducts } from '../stripe-config'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { Wallet, AlertCircle } from 'lucide-react'

export function CreditPurchase() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { credits, loading: creditsLoading } = useCredits()

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      setError('Please sign in to purchase credits')
      return
    }

    setLoading(priceId)
    setError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/credits`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      setError('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to purchase credits</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Purchase Credits</h1>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Current Balance: {creditsLoading ? '...' : credits} Credits
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stripeProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPurchase={handlePurchase}
            loading={loading === product.priceId}
            disabled={!!loading}
          />
        ))}
      </div>
    </div>
  )
}