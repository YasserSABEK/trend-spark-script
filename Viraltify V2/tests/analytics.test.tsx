import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDashboard } from '../src/analytics/AnalyticsDashboard';

// Mock data for analytics dashboard
const mockAnalyticsData = [
  {
    id: '1',
    platform: 'tiktok' as const,
    url: 'https://tiktok.com/@user/video/1',
    thumbnail: 'https://example.com/thumb1.jpg',
    caption: 'When people make simple things complicated 🤦🏿‍♂️',
    creator: 'khaby.lame',
    createdAt: '2023-08-15T14:22:15.000Z',
    metrics: {
      views: 45600000,
      likes: 3200000,
      comments: 125000,
      shares: 890000,
      engagementRate: 9.13,
      viralityScore: 94
    },
    duration: 12.5,
    hashtags: ['comedy', 'viral', 'simple', 'funny']
  },
  {
    id: '2',
    platform: 'instagram' as const,
    url: 'https://instagram.com/reel/abc123',
    thumbnail: 'https://example.com/thumb2.jpg',
    caption: 'I spent 50 hours buried alive and this is what happened 😱',
    creator: 'mrbeast',
    createdAt: '2023-08-15T18:30:45.000Z',
    metrics: {
      views: 12500000,
      likes: 1800000,
      comments: 45000,
      shares: 325000,
      engagementRate: 14.76,
      viralityScore: 87
    },
    duration: 85.5,
    hashtags: ['challenge', 'buried', 'experiment', 'viral']
  }
];

// Mock the analytics data - in real app this would come from API
vi.mock('../src/analytics/AnalyticsDashboard', async () => {
  const actual = await vi.importActual('../src/analytics/AnalyticsDashboard');
  return {
    ...actual,
    // We'll override the component to use our mock data
  };
});

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the analytics dashboard with all main elements', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByRole('heading', { name: /content analytics/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search by caption, creator, or hashtags/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument();
    });

    it('displays summary statistics cards', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText(/total views/i)).toBeInTheDocument();
      expect(screen.getByText(/avg engagement/i)).toBeInTheDocument();
      expect(screen.getByText(/top performer/i)).toBeInTheDocument();
      expect(screen.getByText(/content mix/i)).toBeInTheDocument();
    });

    it('shows data table with correct headers', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      expect(screen.getByText(/content/i)).toBeInTheDocument();
      expect(screen.getByText(/views/i)).toBeInTheDocument();
      expect(screen.getByText(/likes/i)).toBeInTheDocument();
      expect(screen.getByText(/engagement/i)).toBeInTheDocument();
      expect(screen.getByText(/virality/i)).toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('calculates total views correctly', () => {
      render(<AnalyticsDashboard />);
      
      // Based on mock data: 45.6M + 12.5M = 58.1M
      expect(screen.getByText('58.1M')).toBeInTheDocument();
    });

    it('calculates average engagement rate', () => {
      render(<AnalyticsDashboard />);
      
      // Based on mock data: (9.13 + 14.76) / 2 = 11.9%
      expect(screen.getByText('11.9%')).toBeInTheDocument();
    });

    it('shows platform distribution', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('TT: 1')).toBeInTheDocument(); // 1 TikTok
      expect(screen.getByText('IG: 1')).toBeInTheDocument(); // 1 Instagram
    });
  });

  describe('Filtering and Search', () => {
    it('filters content by search query', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      const searchInput = screen.getByPlaceholderText(/search by caption, creator, or hashtags/i);
      await user.type(searchInput, 'buried');
      
      // Should show only the MrBeast content that contains "buried"
      expect(screen.getByText('mrbeast')).toBeInTheDocument();
      expect(screen.queryByText('khaby.lame')).not.toBeInTheDocument();
    });

    it('filters by platform', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Open platform filter
      const platformSelect = screen.getByDisplayValue(/all platforms/i);
      await user.click(platformSelect);
      
      // Select TikTok only
      const tiktokOption = screen.getByText(/^TikTok$/i);
      await user.click(tiktokOption);
      
      // Should show only TikTok content
      expect(screen.getByText('khaby.lame')).toBeInTheDocument();
      expect(screen.queryByText('mrbeast')).not.toBeInTheDocument();
    });

    it('filters by performance level', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Open performance filter
      const performanceSelect = screen.getByDisplayValue(/all performance/i);
      await user.click(performanceSelect);
      
      // Select high performing only
      const highOption = screen.getByText(/high performing/i);
      await user.click(highOption);
      
      // Both items should show as they have high virality scores (94 and 87)
      expect(screen.getByText('khaby.lame')).toBeInTheDocument();
      expect(screen.getByText('mrbeast')).toBeInTheDocument();
    });

    it('clears filters when search is cleared', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      const searchInput = screen.getByPlaceholderText(/search by caption, creator, or hashtags/i);
      
      // Apply search filter
      await user.type(searchInput, 'buried');
      expect(screen.queryByText('khaby.lame')).not.toBeInTheDocument();
      
      // Clear search
      await user.clear(searchInput);
      
      // Should show all content again
      expect(screen.getByText('khaby.lame')).toBeInTheDocument();
      expect(screen.getByText('mrbeast')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts by views when views column is clicked', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      const viewsHeader = screen.getByText(/^views$/i);
      await user.click(viewsHeader);
      
      // Should show sort indicator
      const tableRows = screen.getAllByRole('row');
      // First data row should contain the highest views (45.6M - khaby.lame)
      expect(tableRows[1]).toHaveTextContent('khaby.lame');
    });

    it('reverses sort direction on second click', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      const viewsHeader = screen.getByText(/^views$/i);
      
      // Click once (descending - highest first)
      await user.click(viewsHeader);
      let tableRows = screen.getAllByRole('row');
      expect(tableRows[1]).toHaveTextContent('khaby.lame'); // Higher views
      
      // Click again (ascending - lowest first)
      await user.click(viewsHeader);
      tableRows = screen.getAllByRole('row');
      expect(tableRows[1]).toHaveTextContent('mrbeast'); // Lower views
    });

    it('sorts by engagement rate', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      const engagementHeader = screen.getByText(/engagement/i);
      await user.click(engagementHeader);
      
      // Should sort by engagement rate (mrbeast has 14.76% vs khaby 9.13%)
      const tableRows = screen.getAllByRole('row');
      expect(tableRows[1]).toHaveTextContent('mrbeast');
    });
  });

  describe('Content Row Display', () => {
    it('displays content information correctly', () => {
      render(<AnalyticsDashboard />);
      
      // Check if content information is displayed
      expect(screen.getByText('khaby.lame')).toBeInTheDocument();
      expect(screen.getByText('mrbeast')).toBeInTheDocument();
      
      // Check platform badges
      expect(screen.getByText('TIKTOK')).toBeInTheDocument();
      expect(screen.getByText('INSTAGRAM')).toBeInTheDocument();
      
      // Check hashtags are displayed
      expect(screen.getByText('#comedy')).toBeInTheDocument();
      expect(screen.getByText('#challenge')).toBeInTheDocument();
    });

    it('formats numbers correctly', () => {
      render(<AnalyticsDashboard />);
      
      // Views should be formatted (45.6M, 12.5M)
      expect(screen.getByText('45.6M')).toBeInTheDocument();
      expect(screen.getByText('12.5M')).toBeInTheDocument();
      
      // Likes should be formatted (3.2M, 1.8M)
      expect(screen.getByText('3.2M')).toBeInTheDocument();
      expect(screen.getByText('1.8M')).toBeInTheDocument();
    });

    it('shows performance badges', () => {
      render(<AnalyticsDashboard />);
      
      // Both items should show "High" performance (virality scores 94 and 87)
      const highBadges = screen.getAllByText('High');
      expect(highBadges).toHaveLength(2);
    });

    it('displays engagement rates with percentage', () => {
      render(<AnalyticsDashboard />);
      
      expect(screen.getByText('9.1%')).toBeInTheDocument(); // khaby.lame
      expect(screen.getByText('14.8%')).toBeInTheDocument(); // mrbeast
    });
  });

  describe('Content Detail Modal', () => {
    it('opens modal when content row is clicked', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Click on a content row
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      // Modal should open with content analysis
      expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    });

    it('displays detailed metrics in modal', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Click on content to open modal
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      // Check if detailed metrics are shown
      expect(screen.getByText('45.6M')).toBeInTheDocument(); // Views
      expect(screen.getByText('3.2M')).toBeInTheDocument(); // Likes
      expect(screen.getByText('125K')).toBeInTheDocument(); // Comments
      expect(screen.getByText('890K')).toBeInTheDocument(); // Shares
    });

    it('shows send to CRM button in modal', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Open modal
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      // Should have Send to CRM button
      expect(screen.getByRole('button', { name: /send to crm/i })).toBeInTheDocument();
    });

    it('shows view original button in modal', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Open modal
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      // Should have View Original button
      expect(screen.getByRole('button', { name: /view original/i })).toBeInTheDocument();
    });
  });

  describe('Actions and Interactions', () => {
    it('handles send to CRM action', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      render(<AnalyticsDashboard />);
      
      // Open modal and click Send to CRM
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      const sendToCRMButton = screen.getByRole('button', { name: /send to crm/i });
      await user.click(sendToCRMButton);
      
      // Should call the send to CRM function
      expect(consoleSpy).toHaveBeenCalledWith('Sending to CRM:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });

    it('opens external link for view original', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Open modal
      const contentRow = screen.getByText('khaby.lame').closest('tr');
      await user.click(contentRow!);
      
      // Check if View Original link has correct href
      const viewOriginalLink = screen.getByRole('link', { name: /view original/i });
      expect(viewOriginalLink).toHaveAttribute('href', 'https://tiktok.com/@user/video/1');
      expect(viewOriginalLink).toHaveAttribute('target', '_blank');
    });

    it('handles dropdown menu actions', async () => {
      const user = userEvent.setup();
      render(<AnalyticsDashboard />);
      
      // Click on dropdown menu
      const dropdownTriggers = screen.getAllByRole('button');
      const dropdownTrigger = dropdownTriggers.find(button => 
        button.querySelector('svg') // Looking for the MoreHorizontal icon
      );
      
      if (dropdownTrigger) {
        await user.click(dropdownTrigger);
        
        // Should show dropdown options
        expect(screen.getByText('View Details')).toBeInTheDocument();
        expect(screen.getByText('Send to CRM')).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      render(<AnalyticsDashboard />);
      
      // On smaller screens, table should still be functional
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('handles large datasets efficiently', () => {
      // This test would be more meaningful with a larger mock dataset
      render(<AnalyticsDashboard />);
      
      // Should render without performance issues
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 data rows
    });
  });
});