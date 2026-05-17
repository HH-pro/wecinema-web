"use client";
// components/marketplace/seller/EarningsOverview.tsx
import React from 'react';

interface EarningsOverviewProps {
  stripeStatus: any;
  orderStats: any;
  balanceData: any;
  thisMonthRevenue: number;
  realTimeMetrics: any;
  formatCurrency: (amount: number) => string;
  userId: string | null;
  earningsApi: any;
}

const EarningsOverview: React.FC<EarningsOverviewProps> = ({
  stripeStatus,
  orderStats,
  thisMonthRevenue,
  realTimeMetrics,
  formatCurrency,
  userId,
}) => {
  const metrics = [
    { title: 'Total Orders',      value: orderStats?.totalOrders || 0,                                      change: '+12%', trend: 'up',   icon: '📦', color: 'blue' },
    { title: 'Completed Orders',  value: orderStats?.completed || 0,                                         change: '+8%',  trend: 'up',   icon: '✅', color: 'green' },
    { title: 'Avg Order Value',   value: formatCurrency(realTimeMetrics.avgOrderValue),                      change: realTimeMetrics.monthOverMonthGrowth > 0 ? `+${realTimeMetrics.monthOverMonthGrowth.toFixed(1)}%` : `${realTimeMetrics.monthOverMonthGrowth.toFixed(1)}%`, trend: realTimeMetrics.monthOverMonthGrowth > 0 ? 'up' : 'down', icon: '💰', color: 'yellow' },
    { title: 'Completion Rate',   value: `${realTimeMetrics.completionRate.toFixed(1)}%`,                    change: '+5%',  trend: 'up',   icon: '📊', color: 'purple' },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':   return 'bg-info-bg text-info';
      case 'green':  return 'bg-success-bg text-success';
      case 'yellow': return 'bg-warning-bg text-warning';
      case 'purple': return 'bg-bg-secondary text-text-secondary';
      default:       return 'bg-bg-secondary text-text-secondary';
    }
  };

  return (
    <div className="bg-card-bg border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Earnings Overview</h2>
          <p className="text-text-secondary mt-1">Performance metrics and insights for your sales</p>
        </div>
        <div className="text-sm text-text-tertiary">
          User: {userId?.slice(-6)}...
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                <span className="text-xl">{metric.icon}</span>
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded ${
                metric.trend === 'up'
                  ? 'text-success bg-success-bg'
                  : 'text-danger bg-danger-bg'
              }`}>
                {metric.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{metric.value}</p>
            <p className="text-sm text-text-tertiary mt-1">{metric.title}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-bg-secondary p-5 rounded-xl">
            <h3 className="font-semibold text-text-primary mb-3">Revenue Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Lifetime Revenue',  value: formatCurrency(realTimeMetrics.lifetimeRevenue), cls: 'text-text-primary' },
                { label: 'Total Withdrawn',   value: formatCurrency(realTimeMetrics.totalWithdrawn),  cls: 'text-success' },
                { label: 'Net Earnings',      value: formatCurrency(realTimeMetrics.netEarnings),     cls: 'font-bold text-info' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`font-medium ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* This Month */}
          <div className="bg-bg-secondary p-5 rounded-xl">
            <h3 className="font-semibold text-text-primary mb-3">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Month Revenue</span>
                <span className="font-medium text-text-primary">{formatCurrency(thisMonthRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Growth Rate</span>
                <span className={`font-medium ${realTimeMetrics.monthOverMonthGrowth > 0 ? 'text-success' : 'text-danger'}`}>
                  {realTimeMetrics.monthOverMonthGrowth > 0 ? '+' : ''}{realTimeMetrics.monthOverMonthGrowth.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active Orders</span>
                <span className="font-medium text-text-primary">{realTimeMetrics.pendingOrders}</span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-bg-secondary p-5 rounded-xl">
            <h3 className="font-semibold text-text-primary mb-3">Account Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Stripe Status</span>
                <span className={`font-medium ${stripeStatus?.chargesEnabled ? 'text-success' : 'text-warning'}`}>
                  {stripeStatus?.chargesEnabled ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payouts Enabled</span>
                <span className={`font-medium ${stripeStatus?.payoutsEnabled ? 'text-success' : 'text-danger'}`}>
                  {stripeStatus?.payoutsEnabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Account Type</span>
                <span className="font-medium text-text-primary">{stripeStatus?.accountType || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsOverview;
