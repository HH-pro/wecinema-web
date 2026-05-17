"use client";
// components/marketplace/seller/WithdrawBalance.tsx
import React, { useState } from 'react';

interface WithdrawBalanceProps {
  stripeStatus: any;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  onWithdrawSuccess: (amount: number) => Promise<any>;
  formatCurrency: (amount: number) => string;
  userId: string | null;
  earningsApi: any;
}

const WithdrawBalance: React.FC<WithdrawBalanceProps> = ({
  stripeStatus,
  availableBalance,
  pendingBalance,
  totalEarnings,
  thisMonthEarnings,
  onWithdrawSuccess,
  formatCurrency,
  userId,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!userId) { setError('Please login to withdraw funds'); return; }
    if (!stripeStatus?.chargesEnabled) { setError('Please connect your Stripe account first'); return; }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { setError('Please enter a valid amount'); return; }

    const amountInCents = Math.round(amount * 100);
    if (amountInCents > availableBalance) { setError('Withdrawal amount exceeds available balance'); return; }
    if (amountInCents < 1000) { setError('Minimum withdrawal amount is ₹10'); return; }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const result = await onWithdrawSuccess(amountInCents);
      if (result.success) {
        setSuccess(`Successfully requested withdrawal of ${formatCurrency(amountInCents)}`);
        setWithdrawAmount('');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || 'Withdrawal failed. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWithdraw = (percentage: number) => {
    const amount = (availableBalance * percentage) / 100 / 100;
    setWithdrawAmount(amount.toFixed(2));
  };

  return (
    <div className="bg-info-bg border border-info/30 rounded-2xl p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Your Earnings Balance</h2>
          <p className="text-text-secondary mt-2">
            Withdraw your available balance to your bank account
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-card-bg p-4 rounded-xl border border-border">
              <p className="text-sm text-text-tertiary">Available Now</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(availableBalance)}</p>
              <div className="mt-2 text-xs text-success font-medium">Ready to withdraw</div>
            </div>
            <div className="bg-card-bg p-4 rounded-xl border border-border">
              <p className="text-sm text-text-tertiary">Pending</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{formatCurrency(pendingBalance)}</p>
              <div className="mt-2 text-xs text-warning font-medium">From active orders</div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg p-6 rounded-xl border border-border w-full lg:w-96">
          <h3 className="font-semibold text-text-primary mb-4">Withdraw Funds</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Amount to Withdraw (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent/40 focus:border-accent bg-input-bg text-text-primary placeholder-text-tertiary"
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-3 text-text-tertiary">₹</div>
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                Available: {formatCurrency(availableBalance)}
              </div>
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleQuickWithdraw(percentage)}
                  className="flex-1 px-3 py-2 bg-info-bg text-info text-sm font-medium rounded-lg hover:opacity-80 transition-colors border border-info/30"
                >
                  {percentage}%
                </button>
              ))}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading || !stripeStatus?.chargesEnabled || availableBalance <= 0}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-btn-primary-text font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw Funds'}
            </button>

            {!stripeStatus?.chargesEnabled && (
              <div className="text-sm text-warning bg-warning-bg p-3 rounded-lg border border-accent/30">
                ⚠ Please connect your Stripe account to withdraw funds
              </div>
            )}

            {error && (
              <div className="text-sm text-danger bg-danger-bg p-3 rounded-lg border border-danger/30">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-success bg-success-bg p-3 rounded-lg border border-success/30">
                ✅ {success}
              </div>
            )}

            <div className="text-xs text-text-tertiary">
              <p>• Withdrawals typically take 2-3 business days</p>
              <p>• Minimum withdrawal: ₹10 (1000 in cents)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-info/30">
        <div className="flex justify-between text-sm text-text-secondary">
          <div><span className="font-medium">Total Earnings:</span> {formatCurrency(totalEarnings)}</div>
          <div><span className="font-medium">This Month:</span> {formatCurrency(thisMonthEarnings)}</div>
          <div><span className="font-medium">User ID:</span> {userId?.slice(-8)}</div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawBalance;
