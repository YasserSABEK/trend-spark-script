export interface ShotBreakdown {
  shotNumber: number;
  timing: string;
  visual: string;
  onScreenText: string;
  voiceover: string;
  shotType?: 'hook' | 'main_point' | 'transition' | 'cta';
}

export interface ViralElements {
  hasHook: boolean;
  hasPatternInterrupt: boolean;
  hasCuriosityGap: boolean;
  hasLoopableEnding: boolean;
  hasStrongCTA: boolean;
  hasPersonalization: boolean;
}

export interface PerformanceMetrics {
  score: number;
  estimatedViralPotential: 'low' | 'medium' | 'high' | 'viral';
  engagementPrediction: number;
  optimalLength: number;
  viralElements: ViralElements;
  optimizationSuggestions: string[];
}

export interface EnhancedGeneratedScript {
  id?: string;
  title: string;
  hook: string;
  main_content: string;
  call_to_action: string;
  suggested_hashtags: string[];
  // New viral script fields
  shots?: ShotBreakdown[];
  performanceMetrics?: PerformanceMetrics;
  scriptFormat?: 'basic' | 'viral_shots';
  totalDuration?: string;
  formatType?: string;
  viralTactics?: string[];
}