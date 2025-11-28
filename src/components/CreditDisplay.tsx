import React, { useState, useEffect } from 'react';
import { Coins, Plus, History, Zap } from 'lucide-react';
import { creditService } from '../services/creditService';

interface CreditDisplayProps {
  currentUser?: any;
  onPurchaseClick: () => void;
  compact?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  currentUser,
  onPurchaseClick,
  compact = false
}) => {
  const [credits, setCredits] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    updateCredits();
  }, [currentUser]);

  const updateCredits = () => {
    const balance = creditService.getCreditBalance(currentUser?.id);
    const history = creditService.getCreditHistory(currentUser?.id);
    setCredits(balance);
    setTransactions(history);
  };

  const getCreditColor = () => {
    if (credits >= 20) return 'text-green-400';
    if (credits >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCreditBgColor = () => {
    if (credits >= 20) return 'bg-green-500/20 border-green-500/30';
    if (credits >= 5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border ${getCreditBgColor()}`}>
          <Coins className={`w-4 h-4 ${getCreditColor()}`} />
          <span className={`font-medium ${getCreditColor()}`}>
            {credits}
          </span>
        </div>
        <button
          onClick={onPurchaseClick}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl transition-colors mobile-optimized mobile-button"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Buy</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Credits</h3>
            <p className="text-gray-400 text-sm">Generate logos with credits</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-bold ${getCreditColor()}`}>
            {credits}
          </div>
          <div className="text-sm text-gray-400">Available</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={onPurchaseClick}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all mobile-optimized mobile-button"
        >
          <Plus className="w-5 h-5" />
          <span>Buy Credits</span>
        </button>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors mobile-optimized mobile-button"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {/* Credit Status */}
      <div className={`p-3 rounded-lg border ${getCreditBgColor()}`}>
        <div className="flex items-center space-x-2">
          <Zap className={`w-4 h-4 ${getCreditColor()}`} />
          <span className={`text-sm font-medium ${getCreditColor()}`}>
            {credits >= 20 && 'Plenty of credits available'}
            {credits >= 5 && credits < 20 && 'Good credit balance'}
            {credits > 0 && credits < 5 && 'Low credits - consider buying more'}
            {credits === 0 && 'No credits - purchase required to generate logos'}
          </span>
        </div>
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-white mb-3">Recent Transactions</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'purchase' ? 'bg-green-400' :
                    transaction.type === 'deduction' ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-gray-300">{transaction.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    transaction.type === 'purchase' ? 'text-green-400' :
                    transaction.type === 'deduction' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};