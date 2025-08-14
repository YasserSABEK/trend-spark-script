import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles, MessageCircle } from "lucide-react";

const AICoach = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
          <p className="text-muted-foreground">Get personalized guidance to grow your content</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              AI-Powered Content Coaching
            </CardTitle>
            <CardDescription>
              Your personal AI coach is coming soon to help you create viral content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-8 h-8 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Personalized Insights</h3>
                  <p className="text-muted-foreground">
                    Get tailored recommendations based on your content performance and trending topics
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-8 h-8 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Interactive Guidance</h3>
                  <p className="text-muted-foreground">
                    Chat with AI to get instant feedback on your content strategy and ideas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-muted rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">Coming Soon!</h3>
              <p className="text-muted-foreground">
                We're working hard to bring you the most advanced AI coaching experience for content creators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AICoach;