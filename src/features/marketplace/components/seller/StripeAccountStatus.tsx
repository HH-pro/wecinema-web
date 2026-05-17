"use client";
// StripeAccountStatus.tsx
import React, { useState } from 'react';

interface StripeAccountStatusProps {
  stripeStatus: {
    connected: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    accountId?: string;
    requirements?: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
      disabled_reason?: string;
    };
    verificationNeeded?: boolean;
    missingRequirements?: string[];
    pendingVerification?: string[];
    disabledReason?: string;
    status?: {
      canReceivePayments: boolean;
      missingRequirements: string[];
      needsAction: boolean;
      isActive: boolean;
    };
    account?: {
      id: string;
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
      requirements?: any;
    };
  };
  onSetupClick: () => void;
  onDisconnectClick: () => void;
  isLoading: boolean;
  showDisconnectButton?: boolean;
}

const StripeAccountStatus: React.FC<StripeAccountStatusProps> = ({
  stripeStatus,
  onSetupClick,
  onDisconnectClick,
  isLoading,
  showDisconnectButton = true
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const hasVerificationRequirements = () => {
    if (stripeStatus.status?.needsAction) return true;
    if (stripeStatus.account?.requirements) {
      const req = stripeStatus.account.requirements;
      return (req.currently_due?.length > 0 || req.past_due?.length > 0);
    }
    return false;
  };

  const hasPendingVerification = () =>
    stripeStatus.account?.requirements?.pending_verification?.length > 0;

  const getRequirements = () => {
    const requirements: string[] = [];
    if (stripeStatus.account?.requirements) {
      const req = stripeStatus.account.requirements;
      requirements.push(...(req.currently_due || []), ...(req.past_due || []), ...(req.pending_verification || []));
    }
    if (stripeStatus.missingRequirements) requirements.push(...stripeStatus.missingRequirements);

    return Array.from(new Set(requirements)).map(req => ({
      original: req,
      display: req
        .replace(/individual\.verification\.|company\.verification\./g, '')
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()),
      isDocument: req.includes('document') || req.includes('verification')
    }));
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect your Stripe account? This will prevent you from receiving payments.')) {
      setDisconnectLoading(true);
      try {
        await onDisconnectClick();
      } finally {
        setDisconnectLoading(false);
      }
    }
  };

  const requirements = getRequirements();
  const hasRequirements = requirements.length > 0;
  const isVerificationNeeded = hasVerificationRequirements();
  const isPending = hasPendingVerification();

  const getStatusMessage = () => {
    if (isLoading) return 'Checking Stripe account status...';
    if (!stripeStatus.connected && !stripeStatus.detailsSubmitted) return 'Connect your Stripe account to accept payments';
    if (stripeStatus.account?.charges_enabled) return 'Stripe account is active and ready to accept payments';
    if (isPending) return 'Your documents are under review. This usually takes 1-3 business days.';
    if (isVerificationNeeded) return 'Additional verification required to enable payments';
    if (stripeStatus.detailsSubmitted && !stripeStatus.chargesEnabled) return 'Stripe account connected - pending activation';
    return 'Connect your Stripe account to accept payments';
  };

  const getStatusBadge = () => {
    if (stripeStatus.account?.charges_enabled) return { cls: 'bg-success-bg text-success border-success', dot: '#10B981', label: 'Active' };
    if (isPending) return { cls: 'bg-warning-bg text-warning border-warning', dot: '#F59E0B', label: 'Under Review' };
    if (isVerificationNeeded) return { cls: 'bg-warning-bg text-warning border-warning', dot: '#F97316', label: 'Verification Needed' };
    if (stripeStatus.detailsSubmitted) return { cls: 'bg-info-bg text-info border-info', dot: '#3B82F6', label: 'Setup Incomplete' };
    return { cls: 'bg-danger-bg text-danger border-danger', dot: '#EF4444', label: 'Not Connected' };
  };

  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    if (isPending) return 'Check Verification Status';
    if (isVerificationNeeded) return 'Complete Verification';
    if (stripeStatus.detailsSubmitted && !stripeStatus.chargesEnabled) return 'Complete Setup';
    return 'Connect Stripe Account';
  };

  const getButtonVariant = () => {
    if (isPending) return 'bg-warning-bg text-warning hover:opacity-80';
    if (isVerificationNeeded) return 'bg-warning-bg text-warning hover:opacity-80';
    return 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white';
  };

  const getIcon = () => {
    if (stripeStatus.account?.charges_enabled) return '✅';
    if (isPending) return '⏳';
    if (isVerificationNeeded) return '📄';
    if (stripeStatus.detailsSubmitted) return '🔧';
    return '💰';
  };

  const bannerGradient = isVerificationNeeded
    ? 'from-warning-bg to-warning-bg'
    : 'from-info-bg to-info-bg';
  const bannerBorder = isVerificationNeeded
    ? 'border-warning'
    : 'border-info';
  const iconBg = isVerificationNeeded
    ? 'bg-warning-bg'
    : 'bg-info-bg';

  const badge = getStatusBadge();

  return (
    <div className="mb-6 theme-transition">
      <div className={`bg-gradient-to-r ${bannerGradient} border ${bannerBorder} rounded-2xl p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start">
            <div className={`p-3 rounded-xl mr-4 ${iconBg}`}>
              <span className="text-2xl">{getIcon()}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-primary text-lg mb-2">
                {isVerificationNeeded ? 'Verification Required' : stripeStatus.account?.charges_enabled ? 'Stripe Connected' : 'Stripe Setup Required'}
              </h3>
              <p className="text-text-secondary mb-3">{getStatusMessage()}</p>

              {/* Status Badge */}
              <div className="inline-flex items-center mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.cls} border`}>
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: badge.dot }} />
                  {badge.label}
                </span>

                {hasRequirements && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="ml-3 text-sm font-medium text-info hover:opacity-80 flex items-center"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                    <svg className={`w-4 h-4 ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Disconnect Button */}
              {stripeStatus.connected && showDisconnectButton && (
                <div className="mt-4">
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectLoading}
                    className="px-4 py-2 bg-card-bg hover:bg-danger-bg text-danger border border-danger font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {disconnectLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Disconnect Stripe Account
                      </>
                    )}
                  </button>
                  <p className="text-xs text-text-tertiary mt-2">
                    Disconnecting will prevent you from receiving payments until you reconnect.
                  </p>
                </div>
              )}

              {/* Requirements Details */}
              {showDetails && hasRequirements && (
                <div className="mt-4 p-4 bg-card-bg border border-border rounded-lg">
                  <h4 className="font-medium text-text-primary mb-3">Required Documents/Information:</h4>
                  <ul className="space-y-2">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 bg-danger-bg rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm text-text-secondary">{req.display}</span>
                          {req.isDocument && (
                            <p className="text-xs text-text-tertiary mt-1">
                              Upload a clear photo of your government-issued ID (Passport, Driver's License, etc.)
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {stripeStatus.disabledReason && (
                    <div className="mt-3 p-3 bg-danger-bg border border-danger rounded-lg">
                      <p className="text-sm text-danger">
                        <strong>Reason:</strong> {stripeStatus.disabledReason.replace(/\./g, ' ').replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Info */}
              {isVerificationNeeded && (
                <div className="mt-4 p-4 bg-warning-bg border border-warning rounded-lg">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-warning">Verification Required</h4>
                      <p className="text-sm text-warning mt-1">
                        Stripe requires identity verification to enable payments.
                      </p>
                      <ul className="mt-2 text-sm text-warning space-y-1">
                        <li>• Verification usually takes 1-3 business days</li>
                        <li>• You'll need a government-issued ID</li>
                        <li>• Once verified, you can start accepting payments immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:text-right">
            <button
              onClick={onSetupClick}
              disabled={isLoading}
              className={`px-6 py-3 ${getButtonVariant()} font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center lg:justify-start`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {getButtonText()}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isVerificationNeeded ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ) : isPending ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    )}
                  </svg>
                  {getButtonText()}
                </>
              )}
            </button>

            <div className="mt-4 text-sm">
              {stripeStatus.account?.charges_enabled ? (
                <p className="text-success">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ready to accept payments
                </p>
              ) : isPending ? (
                <p className="text-warning">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verification in progress
                </p>
              ) : isVerificationNeeded ? (
                <p className="text-warning">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.302 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Required for payment processing
                </p>
              ) : (
                <p className="text-info">Required to receive payments from customers</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stripeStatus.account?.charges_enabled && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '💳', label: 'Payment Processing', value: 'Active', colorBg: 'bg-success-bg', colorText: 'text-success' },
            { icon: '⚡', label: 'Payouts', value: stripeStatus.account?.payouts_enabled ? 'Enabled' : 'Pending', colorBg: 'bg-info-bg', colorText: 'text-info' },
            { icon: '🛡️', label: 'Security', value: 'Verified', colorBg: 'bg-bg-tertiary', colorText: 'text-text-secondary' },
          ].map(({ icon, label, value, colorBg, colorText }) => (
            <div key={label} className="bg-card-bg border border-border rounded-xl p-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${colorBg} rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-lg">{icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">{label}</p>
                  <p className={`text-lg font-bold ${colorText}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StripeDisconnectButtonInline: React.FC<{
  onDisconnectClick: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onDisconnectClick, disabled = false, loading = false, size = 'md', className = '' }) => {
  const sizeClasses = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

  const handleClick = async () => {
    if (window.confirm('Are you sure you want to disconnect your Stripe account? This will prevent you from receiving payments.')) {
      await onDisconnectClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${sizeClasses[size]} ${className} bg-card-bg hover:bg-danger-bg text-danger border border-danger font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Disconnecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect Stripe
        </>
      )}
    </button>
  );
};

export default StripeAccountStatus;
