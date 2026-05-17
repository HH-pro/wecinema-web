"use client";
// src/components/marketplace/seller/OrderWorkflowGuide.tsx
import React from 'react';

const OrderWorkflowGuide: React.FC = () => {
  const steps = [
    {
      status: 'paid',
      icon: '💰',
      title: 'Payment Received',
      description: 'Buyer has paid, ready for you to start',
      color: 'from-accent to-accent-hover',
    },
    {
      status: 'processing',
      icon: '📦',
      title: 'Start Processing',
      description: 'Prepare materials and plan your work',
      color: 'from-amber-500 to-amber-600',
    },
    {
      status: 'in_progress',
      icon: '👨‍💻',
      title: 'Start Work',
      description: 'Begin working on the order',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      status: 'delivered',
      icon: '🚚',
      title: 'Deliver Work',
      description: 'Send completed work to buyer',
      color: 'from-violet-500 to-violet-600',
    },
    {
      status: 'completed',
      icon: '✅',
      title: 'Order Complete',
      description: 'Buyer approved, payment released',
      color: 'from-teal-500 to-teal-600',
    },
  ];

  return (
    <div className="theme-transition bg-card-bg rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">How Orders Work</h3>
          <p className="text-sm text-text-secondary mt-1">Follow these steps to successfully complete orders</p>
        </div>
        <div className="text-xs font-medium text-warning bg-warning-bg px-3 py-1 rounded-full border border-warning/30">
          5-Step Process
        </div>
      </div>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-accent/20 hidden md:block" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-6 md:space-y-0">
          {steps.map((step, index) => (
            <div key={step.status} className="flex-1 relative z-10">
              <div className="flex flex-col items-center text-center">
                {/* Step indicator */}
                <div className={`relative mb-4 ${index < steps.length - 1 ? 'md:pr-8' : ''}`}>
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-card-bg shadow-md">
                    <span className="text-xs font-bold text-btn-primary-text">{index + 1}</span>
                  </div>

                  {/* Step icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-md border-2 border-card-bg`}>
                    <span className="text-2xl">{step.icon}</span>
                  </div>

                  {/* Connector arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 right-0 transform translate-x-full">
                      <svg className="w-6 h-6 text-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="px-2">
                  <p className="text-sm font-medium text-text-primary mb-1">{step.title}</p>
                  <p className="text-xs text-text-tertiary leading-relaxed">{step.description}</p>
                </div>

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="md:hidden w-0.5 h-8 bg-accent/20 my-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Points */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="text-sm font-medium text-text-primary mb-3">Key Points to Remember:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2 p-3 bg-warning-bg rounded-lg border border-warning/20">
            <svg className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-text-secondary">Communicate with buyers regularly</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-success-bg rounded-lg border border-success/20">
            <svg className="w-4 h-4 text-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-text-secondary">Deliver quality work on time</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-info-bg rounded-lg border border-info/20">
            <svg className="w-4 h-4 text-info mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-text-secondary">Use revisions to ensure satisfaction</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.open('/help/order-guide', '_blank')}
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-warning bg-warning-bg rounded-xl hover:opacity-90 transition-all duration-200 border border-warning/30 shadow-sm hover:shadow"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Detailed Order Guide
        </button>
      </div>
    </div>
  );
};

export default OrderWorkflowGuide;
