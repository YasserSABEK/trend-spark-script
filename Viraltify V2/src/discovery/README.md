# 🔍 Discovery Module

The Discovery module is the entry point for content collection in Viraltify V2. It provides a clean, intuitive interface for users to scrape viral content from TikTok and Instagram profiles.

## 📋 Overview

The Discovery page serves as the primary content acquisition tool, allowing users to:
- Enter profile URLs from TikTok or Instagram
- Select the number of posts to scrape (10, 20, 50, 100, 1000)
- Monitor scraping progress in real-time
- View scraped profile summaries
- Navigate to detailed analytics

## 🎨 Design Philosophy

**Simplicity First**: The interface prioritizes ease of use with a Google-like search experience. The main focus is a large, prominent URL input field with clear platform selection and minimal distractions.

**Progressive Disclosure**: Advanced options (number of posts, filters) are available but don't overwhelm new users. The interface reveals complexity only when needed.

**Immediate Feedback**: Loading states, progress indicators, and real-time updates keep users informed throughout the scraping process.

## 🏗️ Component Structure

```
DiscoveryPage.tsx
├── PlatformSelector         # TikTok/Instagram toggle
├── URLInput                 # Main profile URL input
├── PostQuantitySelector     # Number of posts dropdown
├── ScrapeButton            # Primary action button
├── LoadingIndicator        # Progress and status display
└── ResultsGrid             # Profile cards display
    └── ProfileCard         # Individual profile summary
        ├── Thumbnail
        ├── BasicMetrics
        ├── RefreshButton
        └── AnalyticsLink
```

## 📊 Data Flow

1. **User Input**: User enters profile URL and selects platform/quantity
2. **Validation**: URL format and platform compatibility checked
3. **API Call**: Bright Data scraping initiated via Edge Function
4. **Polling**: Regular status checks until completion
5. **Storage**: Results saved to user's account in database
6. **Display**: Profile cards shown with summary metrics
7. **Navigation**: Click-through to Analytics for detailed view

## 🔌 Integration Points

### Bright Data APIs
- **Instagram**: `gd_lyclm20il4r5helnj` dataset
- **TikTok**: `gd_m7n5v2gq296pex2f5m` dataset
- **Polling**: Results retrieval via snapshot ID

### Database Tables
- `scraped_profiles`: Profile metadata and summary
- `scraped_content`: Individual posts/videos
- `scraping_jobs`: Job status and progress tracking

### Edge Functions
- `scrape-instagram`: Instagram profile scraping
- `scrape-tiktok`: TikTok profile scraping  
- `get-scraping-results`: Polling for completion

## 💡 Key Features

### Platform Detection
Automatically detect platform from URL format:
- TikTok: `tiktok.com/@username` or `tiktok.com/t/`
- Instagram: `instagram.com/username` or `instagr.am/`

### Smart Defaults
- Default to 20 posts for balanced speed/value
- Remember user's last platform selection
- Suggest optimal post quantities based on profile size

### Error Handling
- Invalid URL format detection
- Rate limiting and quota management
- Network failure recovery
- Clear user guidance for issues

### Progress Tracking
- Real-time scraping progress
- Estimated completion time
- Detailed status messages
- Cancel operation capability

## 🎯 User Experience Goals

### Speed to Value
- Users should see first results within 30 seconds
- Clear progress indication reduces perceived wait time
- Immediate profile summary provides quick validation

### Error Prevention
- URL validation prevents invalid submissions
- Platform mismatch warnings
- Quota warnings before expensive operations

### Discoverability
- Prominent "Try Example" links for new users
- Recently scraped profiles for quick re-access
- Suggested profiles based on trends

## 📱 Responsive Design

### Mobile (< 768px)
- Single-column layout
- Touch-friendly controls
- Simplified post quantity selector
- Stacked profile cards

### Tablet (768px - 1024px)
- Two-column result grid
- Compact platform selector
- Optimized touch targets

### Desktop (> 1024px)
- Three-column result grid
- Full feature set visible
- Keyboard shortcuts enabled

## 🔄 State Management

### Loading States
- `idle`: Ready for input
- `validating`: Checking URL format
- `scraping`: API call in progress
- `polling`: Waiting for results
- `complete`: Results available
- `error`: Failed operation

### Data States
- Recent profiles cache
- User preferences (platform, quantity)
- Scraping job history
- Rate limit tracking

## 🧪 Testing Strategy

### Unit Tests
- URL validation logic
- Platform detection
- Component rendering
- State management

### Integration Tests
- API communication
- Database operations
- Error handling flows
- User interaction patterns

### E2E Tests
- Complete scraping workflows
- Cross-platform functionality
- Error recovery scenarios
- Performance under load

## 📈 Analytics & Monitoring

### User Metrics
- Scraping success rate
- Time to completion
- Platform preference
- Error frequency

### Performance Metrics
- API response times
- UI responsiveness
- Memory usage
- Network efficiency

### Business Metrics
- Profiles scraped per user
- Feature adoption rate
- User retention impact
- Conversion to paid features

---

*The Discovery module sets the foundation for the entire Viraltify experience - making it intuitive and reliable is crucial for user success.*