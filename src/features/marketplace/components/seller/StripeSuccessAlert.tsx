"use client";
// components/marketplace/seller/StripeSuccessAlert.tsx
import React, { useEffect, useState } from 'react';

interface StripeSuccessAlertProps {
  show: boolean;
  onClose: () => void;
}

const StripeSuccessAlert: React.FC<StripeSuccessAlertProps> = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setCountdown(5);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else {
      setIsVisible(false);
    }
  }, [show, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in">
      <div className="theme-transition bg-success-bg border border-success/30 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-success/15 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-bold text-text-primary">
                🎉 Stripe Connected Successfully!
              </h3>
              <button
                onClick={() => { setIsVisible(false); onClose(); }}
                className="text-text-tertiary hover:text-text-primary ml-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-text-secondary">
                Your Stripe account is now connected and ready to accept payments.
              </p>
              <div className="mt-3 bg-card-bg rounded-lg p-3 border border-border">
                <div className="space-y-2 text-xs">
                  {[
                    'Accept credit card payments',
                    'Direct transfers to your bank',
                    'Fully verified account',
                  ].map(label => (
                    <div key={label} className="flex items-center">
                      <div className="w-2 h-2 bg-success rounded-full mr-2" />
                      <span className="text-text-secondary">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-text-tertiary">
                Closing in {countdown}s
              </div>
              <button
                onClick={() => { setIsVisible(false); onClose(); }}
                className="text-sm font-medium text-success hover:opacity-80 px-3 py-1 rounded-md bg-success/15 hover:bg-success/25 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeSuccessAlert;
