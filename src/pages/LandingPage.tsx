import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  Clock, 
  Target, 
  Check,
  Star,
  Play,
  Heart,
  MessageSquare,
  Share
} from "lucide-react";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-instagram-pink/10 via-instagram-purple/10 to-instagram-orange/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-gradient-to-r from-instagram-pink to-instagram-purple text-white border-none">
            🔥 Turn Viral Reels Into Your Next Hit
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-instagram-pink via-instagram-purple to-instagram-orange bg-clip-text text-transparent">
              Turn Viral Instagram Reels
            </span>
            <br />
            <span className="text-foreground">Into Your Next Hit</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered Instagram viral content discovery + personalized script generation for content creators. 
            Stop guessing what works - start creating with proven viral formulas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90 text-lg px-8 py-6">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 from 1,200+ creators</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>500M+ views generated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Go Viral
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover, analyze, and recreate viral Instagram content with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-instagram-pink to-instagram-purple flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Instagram Discovery</CardTitle>
                <CardDescription>
                  Real-time scraping of viral Instagram Reels with engagement metrics, viral scores, and trending analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Live viral content updates
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Engagement rate analysis
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Hashtag & trend tracking
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-instagram-purple to-instagram-orange flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Script Generation</CardTitle>
                <CardDescription>
                  AI-powered script creation tailored to your niche, audience, and brand voice using proven viral formulas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Personalized to your brand
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Viral hook formulas
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    CTA optimization
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-instagram-orange to-instagram-yellow flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Deep insights into what's working, optimal posting times, and performance tracking for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Performance analytics
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Optimal timing insights
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    Success rate tracking
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to create viral content, in one plan
          </p>

          <Card className="border-2 border-primary/50 relative overflow-hidden max-w-md mx-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-instagram-pink to-instagram-purple"></div>
            <CardHeader className="text-center pt-8">
              <Badge className="mx-auto mb-4 bg-gradient-to-r from-instagram-pink to-instagram-purple text-white border-none">
                Most Popular
              </Badge>
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <div className="text-4xl font-bold mt-4">
                $97
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited viral content discovery</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>AI script generation (unlimited)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Advanced analytics & insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Real-time Instagram scraping</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </div>
              </div>
              <Link to="/auth">
                <Button className="w-full bg-gradient-to-r from-instagram-pink to-instagram-purple hover:opacity-90">
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Content Creators
            </h2>
            <p className="text-xl text-muted-foreground">
              See what creators are saying about Viraltify
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "@sarah_creates",
                followers: "145K followers",
                text: "Viraltify helped me identify viral trends before they exploded. My engagement increased by 400% in just 2 months!",
                metric: "400% engagement increase"
              },
              {
                name: "@mike_fitness",
                followers: "89K followers", 
                text: "The AI script generator is incredible. It understands my fitness niche perfectly and creates scripts that actually convert.",
                metric: "50M+ views generated"
              },
              {
                name: "@lifestyle_emma",
                followers: "200K followers",
                text: "Finally, a tool that shows me exactly what content is working. I've had 3 videos go viral this month using Viraltify!",
                metric: "3 viral videos this month"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.followers}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {testimonial.metric}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does Viraltify discover viral Instagram content?",
                a: "We use advanced Instagram scraping technology powered by Apify to monitor trending content in real-time. Our AI analyzes engagement rates, view counts, and viral patterns to identify content with the highest potential."
              },
              {
                q: "Can I customize the AI-generated scripts?",
                a: "Absolutely! Our script generator learns your brand voice, niche, and target audience to create personalized content. You can further edit and customize every script to match your style perfectly."
              },
              {
                q: "How often is the viral content updated?",
                a: "Our system continuously scrapes Instagram for new viral content throughout the day. You'll always have access to the freshest trending content and emerging viral patterns."
              },
              {
                q: "Is there a limit to how many scripts I can generate?",
                a: "No limits! With our Pro plan, you get unlimited script generation. Create as many scripts as you need to fuel your content creation."
              },
              {
                q: "Do you provide analytics on my generated content performance?",
                a: "Yes! We track the performance of content created with our scripts and provide insights on what's working best for your specific niche and audience."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-instagram-pink via-instagram-purple to-instagram-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Create Your Next Viral Hit?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of creators who are already using Viraltify to go viral
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6">
              <Zap className="w-5 h-5 mr-2" />
              Start Your Free Trial Now
            </Button>
          </Link>
          <p className="text-white/80 mt-4">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};