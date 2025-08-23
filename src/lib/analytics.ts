// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = 'G-BVEZQKV3YT';

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific tracking functions for Viraltify
export const analytics = {
  // Authentication events
  trackSignUp: (method: string) => trackEvent('sign_up', 'authentication', method),
  trackLogin: (method: string) => trackEvent('login', 'authentication', method),
  trackLogout: () => trackEvent('logout', 'authentication'),

  // Content interaction events
  trackSearch: (searchType: 'hashtag' | 'creator', query: string) => 
    trackEvent('search', 'content_discovery', `${searchType}:${query}`),
  
  trackScriptGeneration: (action: 'start' | 'complete') => 
    trackEvent(`script_${action}`, 'content_creation'),
  
  trackContentView: (contentType: 'reel' | 'tiktok', contentId: string) => 
    trackEvent('content_view', 'engagement', `${contentType}:${contentId}`),

  // Subscription events
  trackCheckoutStart: (planType: string) => 
    trackEvent('begin_checkout', 'subscription', planType),
  
  trackPurchase: (planType: string, value: number) => 
    trackEvent('purchase', 'subscription', planType, value),

  // Feature usage
  trackFeatureUse: (feature: string) => 
    trackEvent('feature_use', 'engagement', feature),
  
  trackCreditUse: (feature: string, creditsUsed: number) => 
    trackEvent('credit_use', 'monetization', feature, creditsUsed),
};