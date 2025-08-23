import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { PerformanceMetrics as PerformanceMetricsType } from '@/types/viral-script';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const getViralPotentialColor = (potential: string) => {
    switch (potential) {
      case 'viral': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const viralElementsData = [
    { key: 'hasHook', label: 'Strong Hook', icon: Target },
    { key: 'hasPatternInterrupt', label: 'Pattern Interrupts', icon: Zap },
    { key: 'hasCuriosityGap', label: 'Curiosity Gap', icon: TrendingUp },
    { key: 'hasLoopableEnding', label: 'Loopable Ending', icon: Clock },
    { key: 'hasStrongCTA', label: 'Strong CTA', icon: Target },
    { key: 'hasPersonalization', label: 'Personalization', icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`text-3xl font-bold ${getScoreColor(metrics.score)}`}>
                {metrics.score}/100
              </div>
              <Badge className={getViralPotentialColor(metrics.estimatedViralPotential)}>
                {metrics.estimatedViralPotential.charAt(0).toUpperCase() + metrics.estimatedViralPotential.slice(1)} Potential
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Engagement Prediction</div>
              <div className="text-lg font-semibold">{metrics.engagementPrediction}%</div>
            </div>
          </div>
          <Progress value={metrics.score} className="h-2" />
          <div className="mt-2 text-sm text-muted-foreground">
            Optimal length: {metrics.optimalLength}s
          </div>
        </CardContent>
      </Card>

      {/* Viral Elements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Viral Elements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {viralElementsData.map(({ key, label, icon: Icon }) => {
              const isPresent = metrics.viralElements[key as keyof typeof metrics.viralElements];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isPresent 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {isPresent ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      {metrics.optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.optimizationSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};