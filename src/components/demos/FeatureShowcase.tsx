import { AnalyticsGuard } from '@/components/analytics/AnalyticsGuard';
import { ProfileLimitGuard } from '@/components/credits/ProfileLimitGuard';
import { CreditGuard } from '@/components/credits/CreditGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Zap, TrendingUp, Target, Calendar } from 'lucide-react';

// Demo component to showcase new features
export const FeatureShowcase = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">New Pricing Plans & Features</h2>
        <p className="text-muted-foreground mb-6">
          Experience our enhanced pricing structure with improved feature gating and credit management.
        </p>
      </div>

      {/* Analytics Feature Gating Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analytics Access Control</h3>
        <p className="text-sm text-muted-foreground">
          Advanced analytics are now restricted to Pro and Agency plans only.
        </p>
        
        <AnalyticsGuard feature="Performance Analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Advanced insights and analytics for your content strategy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">+125%</div>
                    <div className="text-sm text-muted-foreground">Engagement</div>
                  </div>
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">87%</div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnalyticsGuard>
      </div>

      {/* Profile Limit Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Creator Profile Limits</h3>
        <p className="text-sm text-muted-foreground">
          Free users are limited to 1 creator profile. Try creating another profile to see the limit guard.
        </p>
        
        <ProfileLimitGuard currentProfileCount={1}>
          <Button className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Create New Creator Profile
          </Button>
        </ProfileLimitGuard>
      </div>

      {/* Credit System Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Enhanced Credit System</h3>
        <p className="text-sm text-muted-foreground">
          Credits are now enforced consistently across all actions. Agency plans have unlimited credits.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <CreditGuard requiredCredits={1} action="generate a script">
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Generate Script (1 Credit)
            </Button>
          </CreditGuard>
          
          <CreditGuard requiredCredits={1} action="analyze content">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analyze Content (1 Credit)
            </Button>
          </CreditGuard>
        </div>
      </div>

      {/* Plan Benefits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Plan Benefits</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">5 Credits</Badge>
              <Badge variant="outline" className="w-full justify-center">1 Profile</Badge>
              <div className="text-xs text-muted-foreground">Basic features only</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Starter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-center bg-green-50">50 Credits</Badge>
              <Badge variant="outline" className="w-full justify-center">Unlimited Profiles</Badge>
              <div className="text-xs text-muted-foreground">All features</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-center bg-blue-50">200 Credits</Badge>
              <Badge variant="outline" className="w-full justify-center">Advanced Analytics</Badge>
              <div className="text-xs text-muted-foreground">Premium support</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Agency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-center bg-purple-50">Unlimited</Badge>
              <Badge variant="outline" className="w-full justify-center">Agency Features</Badge>
              <div className="text-xs text-muted-foreground">Fair-use policy</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};