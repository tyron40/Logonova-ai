import React, { useEffect, useState } from 'react'
import { CheckCircle, Coins, ArrowRight, Loader2 } from 'lucide-react'
import { useCredits } from '../hooks/useCredits'
import { useAuth } from '../hooks/useAuth'

export function SuccessPage() {
  const [loading, setLoading] = useState(true)
  const { credits, refetchCredits } = useCredits()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Refetch credits after successful payment
      setTimeout(() => {
        refetchCredits()
        setLoading(false)
      }, 2000) // Give webhook time to process
    }
  }, [user, refetchCredits])

  const handleContinue = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your payment has been processed successfully.
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mb-6">
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <span className="text-green-800">Updating your credits...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Coins className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Current Balance: {credits} Credits
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <span>Continue to App</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-sm text-gray-500 mt-4">
          You can start using your credits immediately.
        </p>
      </div>
    </div>
  )
}