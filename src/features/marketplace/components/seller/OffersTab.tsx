"use client";
// src/components/marketplae/seller/OffersTab.tsx
import React from 'react';

interface Offer {
  _id: string;
  status: string;
  amount: number;
  message?: string;
  createdAt: string;
  listingId: {
    _id: string;
    title: string;
    price?: number;
    mediaUrls?: string[];
  };
  buyerId: {
    _id: string;
    username: string;
  };
}

interface OffersTabProps {
  offers: Offer[];
  loading: boolean;
  onOfferAction: (offerId: string, action: string) => void;
  onPlayVideo: (videoUrl: string, title: string) => void;
  onRefresh: () => void;
}

const OffersTab: React.FC<OffersTabProps> = ({
  offers,
  loading,
  onOfferAction,
  onPlayVideo,
  onRefresh
}) => {
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-success-bg text-success border-border';
      case 'pending':  return 'bg-warning-bg text-warning border-border';
      case 'rejected': return 'bg-danger-bg text-danger border-border';
      default:         return 'bg-bg-tertiary text-text-secondary border-border';
    }
  };

  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const getFirstVideoUrl = (mediaUrls: string[] = []): string | null =>
    mediaUrls.find(url => isVideoUrl(url)) || null;

  return (
    <div className="bg-card-bg rounded-2xl shadow-sm border border-border overflow-hidden theme-transition">
      <div className="px-6 py-5 border-b border-border bg-bg-secondary">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Received Offers</h2>
            <p className="text-sm text-text-secondary mt-1">Manage and respond to offers from buyers</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-btn-secondary-bg border border-border rounded-lg text-sm font-medium text-btn-secondary-text hover:bg-btn-secondary-hover hover:shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Offers'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-text-tertiary">💼</div>
            <h3 className="text-lg font-medium text-text-primary">No offers yet</h3>
            <p className="mt-2 text-text-tertiary">When buyers make offers on your listings, they'll appear here.</p>
            <p className="text-sm text-text-tertiary mt-2">Share your listings to get more offers!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {offers.map(offer => {
              const videoUrl = getFirstVideoUrl(offer.listingId?.mediaUrls);

              return (
                <div key={offer._id} className="border border-border rounded-xl p-6 hover:border-accent hover:shadow-sm transition-all duration-200">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="lg:w-2/3">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-text-primary">
                            {offer.listingId?.title || 'Unknown Listing'}
                          </h3>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                              {offer.status ? offer.status.charAt(0).toUpperCase() + offer.status.slice(1) : 'Unknown'}
                            </span>
                            <span className="text-sm text-text-tertiary">
                              From: {offer.buyerId?.username || 'Unknown Buyer'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-success">{formatCurrency(offer.amount || 0)}</p>
                          {offer.listingId?.price && (
                            <p className="text-sm text-text-tertiary line-through">
                              Original: {formatCurrency(offer.listingId.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      {offer.message && (
                        <div className="mb-4">
                          <p className="text-sm text-text-secondary mb-2 font-medium">Buyer's Message:</p>
                          <div className="bg-bg-secondary border border-border rounded-lg p-4">
                            <p className="text-text-secondary italic">"{offer.message}"</p>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-text-tertiary">
                        Received on {formatDate(offer.createdAt)}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:w-1/3">
                      {videoUrl && (
                        <div className="mb-4">
                          <p className="text-sm text-text-secondary mb-2 font-medium">Listing Video:</p>
                          <div
                            className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => onPlayVideo(videoUrl, offer.listingId?.title || 'Video')}
                          >
                            <video className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" preload="metadata">
                              <source src={videoUrl} type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              Click to play
                            </div>
                          </div>
                        </div>
                      )}

                      {offer.status === 'pending' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => onOfferAction(offer._id, 'accept')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Accept Offer
                          </button>
                          <button
                            onClick={() => onOfferAction(offer._id, 'reject')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline Offer
                          </button>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="bg-success-bg border border-border rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-success mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-success">Offer accepted! Waiting for buyer payment.</p>
                          </div>
                        </div>
                      )}

                      {offer.status === 'rejected' && (
                        <div className="bg-danger-bg border border-border rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-danger mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-danger">Offer declined.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersTab;
