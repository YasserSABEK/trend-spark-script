import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiscoveryPage } from '../src/discovery/DiscoveryPage';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock data for successful scraping response
const mockScrapingResponse = {
  jobId: 'job_123',
  status: 'initiated'
};

const mockStatusResponse = {
  status: 'completed',
  results: [
    {
      id: '1',
      platform: 'tiktok',
      username: 'testuser',
      displayName: 'Test User',
      thumbnail: 'https://example.com/thumb.jpg',
      followerCount: 100000,
      totalPosts: 50,
      scrapedPosts: 20,
      status: 'completed',
      createdAt: '2023-08-15T14:22:15.000Z'
    }
  ]
};

describe('DiscoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the discovery page with all main elements', () => {
      render(<DiscoveryPage />);
      
      expect(screen.getByRole('heading', { name: /discover viral content/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter tiktok profile url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /scrape profile/i })).toBeInTheDocument();
      expect(screen.getByText(/tiktok/i)).toBeInTheDocument();
      expect(screen.getByText(/instagram/i)).toBeInTheDocument();
    });

    it('shows empty state when no results are available', () => {
      render(<DiscoveryPage />);
      
      expect(screen.getByText(/ready to discover viral content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try tiktok example/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try instagram example/i })).toBeInTheDocument();
    });

    it('has scrape button disabled when URL is empty', () => {
      render(<DiscoveryPage />);
      
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      expect(scrapeButton).toBeDisabled();
    });
  });

  describe('Platform Selection', () => {
    it('defaults to TikTok platform', () => {
      render(<DiscoveryPage />);
      
      const tiktokButton = screen.getByRole('button', { name: /tiktok/i });
      expect(tiktokButton).toHaveClass('bg-primary'); // Assuming default variant has this class
    });

    it('switches platform when clicked', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      const instagramButton = screen.getByRole('button', { name: /instagram/i });
      await user.click(instagramButton);
      
      expect(screen.getByPlaceholderText(/enter instagram profile url/i)).toBeInTheDocument();
    });

    it('auto-detects platform from URL', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      await user.type(urlInput, 'https://instagram.com/testuser');
      
      // Platform should switch to Instagram
      expect(screen.getByPlaceholderText(/enter instagram profile url/i)).toBeInTheDocument();
    });
  });

  describe('URL Validation', () => {
    it('shows error for invalid TikTok URL format', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'invalid-url');
      await user.click(scrapeButton);
      
      expect(screen.getByText(/please enter a valid tiktok profile url/i)).toBeInTheDocument();
    });

    it('shows error for invalid Instagram URL format', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      // Switch to Instagram
      const instagramButton = screen.getByRole('button', { name: /instagram/i });
      await user.click(instagramButton);
      
      const urlInput = screen.getByPlaceholderText(/enter instagram profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'invalid-url');
      await user.click(scrapeButton);
      
      expect(screen.getByText(/please enter a valid instagram profile url/i)).toBeInTheDocument();
    });

    it('accepts valid TikTok URL formats', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      
      // No error should be shown
      expect(screen.queryByText(/please enter a valid/i)).not.toBeInTheDocument();
    });

    it('accepts valid Instagram URL formats', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      // Switch to Instagram
      const instagramButton = screen.getByRole('button', { name: /instagram/i });
      await user.click(instagramButton);
      
      const urlInput = screen.getByPlaceholderText(/enter instagram profile url/i);
      
      await user.type(urlInput, 'https://instagram.com/testuser');
      
      // No error should be shown
      expect(screen.queryByText(/please enter a valid/i)).not.toBeInTheDocument();
    });
  });

  describe('Post Count Selection', () => {
    it('defaults to 20 posts', () => {
      render(<DiscoveryPage />);
      
      // Check if the select component shows 20 posts as default
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });

    it('allows changing post count', async () => {
      const user = userEvent.setup();
      render(<DiscoveryPage />);
      
      // Open the select dropdown
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      // Select 50 posts option
      const option50 = screen.getByText('50 posts');
      await user.click(option50);
      
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });
  });

  describe('Scraping Process', () => {
    it('initiates scraping with valid URL', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockScrapingResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        });
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      // Should show loading state
      expect(screen.getByText(/starting scrape/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });
    });

    it('displays results after successful scraping', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockScrapingResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        });
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/scraped profiles/i)).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });
    });
  });

  describe('Result Cards', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      
      // Mock successful scraping to show results
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockScrapingResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse)
        });
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      // Wait for results to appear
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('displays profile information correctly', () => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('100,000')).toBeInTheDocument(); // Follower count
      expect(screen.getByText('20 / 50')).toBeInTheDocument(); // Posts scraped
    });

    it('shows platform badge', () => {
      expect(screen.getByText('TIKTOK')).toBeInTheDocument();
    });

    it('has refresh and analytics buttons', () => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view analytics/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows correct loading messages during different phases', async () => {
      const user = userEvent.setup();
      
      // Mock delayed responses to test loading states
      (fetch as any)
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockScrapingResponse)
            }), 100)
          )
        );
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      // Should show validating first
      expect(screen.getByText(/validating url/i)).toBeInTheDocument();
    });

    it('disables form during scraping', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      (fetch as any)
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockScrapingResponse)
            }), 100)
          )
        );
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      // Form elements should be disabled
      expect(urlInput).toBeDisabled();
      expect(scrapeButton).toBeDisabled();
    });
  });

  describe('Progress Tracking', () => {
    it('shows progress bar during scraping', async () => {
      const user = userEvent.setup();
      
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockScrapingResponse)
        });
      
      render(<DiscoveryPage />);
      
      const urlInput = screen.getByPlaceholderText(/enter tiktok profile url/i);
      const scrapeButton = screen.getByRole('button', { name: /scrape profile/i });
      
      await user.type(urlInput, 'https://tiktok.com/@testuser');
      await user.click(scrapeButton);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/% complete/i)).toBeInTheDocument();
    });
  });
});