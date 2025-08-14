import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleSignupPopup } from "@/components/GoogleSignupPopup";
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Play,
  Check,
  Star,
  Rocket,
  Clock,
  Users,
  ArrowRight,
  Zap,
  Heart,
  MessageSquare,
  Share,
  Timer,
  Shield,
  Globe
} from "lucide-react";

export const LandingPage = () => {
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const stats = [
    { label: "creators trust us", value: "thousands of" },
    { label: "views generated", value: "500M+" },
    { label: "hours saved weekly", value: "15+" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      handle: "@sarahfitslife", 
      followers: "287K",
      quote: "Viraltify helped me go from 12K to 287K followers. The AI scripts sound exactly like me!",
      result: "+380% engagement"
    },
    {
      name: "Mike Rodriguez", 
      handle: "@mikecoachingfit",
      followers: "156K", 
      quote: "I was spending 4 hours daily looking for content ideas. Now I spend 15 minutes.",
      result: "15h saved weekly"
    },
    {
      name: "Emma Thompson",
      handle: "@emmacooks",
      followers: "94K",
      quote: "I've caught 3 viral food trends before they exploded. My reach went through the roof!",
      result: "+420% reach"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-full px-4 py-2 mb-6">
            <Rocket className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-200">🚀 Save 15+ hours weekly • Join thousands of creators</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            All‑in‑one platform for{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              viral content
            </span>{" "}
            growth
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-4xl mx-auto">
            Find trending Reels & TikToks and get scripts that sound like you. Turn any viral trend into your next hit.
          </p>
          
          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-8 py-4 h-auto hover:from-purple-700 hover:to-pink-700"
              onClick={() => setShowGooglePopup(true)}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>
            <Button 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10 text-lg px-8 py-4 h-auto"
              onClick={() => setShowGooglePopup(true)}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>
          </div>

          {/* Social Proof Chips */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-600/30 rounded-full px-4 py-2"
              >
                <span className="text-sm text-green-200">
                  {stat.value} {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-full px-4 py-2 mb-6">
                <Play className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-200">See it in action</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Daily{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  viral ideas
                </span>{" "}
                delivered
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Get fresh content ideas every day based on what's trending in your niche. Our AI analyzes millions of posts to find the best opportunities.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Real-time trending analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Personalized to your niche</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-gray-300">Script generation included</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 h-auto hover:from-purple-700 hover:to-pink-700"
                onClick={() => setShowGooglePopup(true)}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                See today's ideas
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
                <div className="relative">
                  <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center border border-gray-600">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-400">Demo Video</p>
                      <p className="text-sm text-gray-500">See Viraltify in action</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">How to Find Viral Content in 2 Minutes</h4>
                      <p className="text-sm text-gray-400">Watch how creators use our platform</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      12K views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - The Ultimate Viral Content Toolkit */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The Ultimate{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Viral Content
              </span>{" "}
              Toolkit
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to consistently create viral content that your audience loves
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-6 h-6 text-white" />,
                title: "Trend Radar",
                description: "Real-time discovery of viral sounds & formats with niche filters"
              },
              {
                icon: <Brain className="w-6 h-6 text-white" />,
                title: "AI Script Generator", 
                description: "Generates hooks, bodies and CTAs tailored to your voice"
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-white" />,
                title: "Performance Analytics",
                description: "Engagement tracking, viral score predictions and ROI insights"
              },
              {
                icon: <Clock className="w-6 h-6 text-white" />,
                title: "Daily Ideas",
                description: "New content ideas every day based on what's working"
              },
              {
                icon: <Users className="w-6 h-6 text-white" />,
                title: "Hashtag & Sound Explorer",
                description: "Discover high-impact hashtags and trending audio"
              },
              {
                icon: <Rocket className="w-6 h-6 text-white" />,
                title: "Team Collaboration",
                description: "Shared workspaces, roles and comments"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-purple-600/50 transition-all duration-300 backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              See all features
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                thousands of creators
              </span>{" "}
              worldwide
            </h2>
            <div className="flex justify-center items-center gap-2 mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xl font-semibold ml-2">4.9/5</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="text-2xl font-semibold">{testimonials[currentTestimonial].name}</h4>
                <p className="text-gray-400">{testimonials[currentTestimonial].handle} • {testimonials[currentTestimonial].followers} followers</p>
              </div>
              
              <blockquote className="text-xl italic mb-6 text-gray-300">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/30 rounded-full px-4 py-2">
                <span className="text-green-400 font-semibold">{testimonials[currentTestimonial].result}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-20">
          {/* Trend Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-400">Trending Dashboard</p>
                  <p className="text-sm text-gray-500">Real-time viral content tracking</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Never miss a{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  trending moment
                </span>
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Trending Hashtags</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Viral Scores</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Niche Filters</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 h-auto hover:from-purple-700 hover:to-pink-700"
                onClick={() => setShowGooglePopup(true)}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Explore trending reels
              </Button>
            </div>
          </div>

          {/* Personalized Scripts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-bold mb-6">
                Personalized{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  scripts & ideas
                </span>
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Tailored Hooks & CTAs</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Predict Views & Outcomes</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Find Untapped Opportunities</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 h-auto hover:from-purple-700 hover:to-pink-700"
                onClick={() => setShowGooglePopup(true)}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                See today's ideas
              </Button>
            </div>
            
            <div className="order-1 lg:order-2 bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-400">Script Generator</p>
                  <p className="text-sm text-gray-500">AI-powered content creation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about Viraltify
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How is this different from just browsing Instagram?",
                answer: "While browsing shows you random content, Viraltify uses AI to analyze millions of posts, identify trending patterns before they explode, and finds content specifically relevant to your niche. We also provide viral scores, engagement analytics, and generate personalized scripts."
              },
              {
                question: "Will the AI scripts sound like me?",
                answer: "Absolutely! Our AI learns your brand voice, tone, and style preferences. You can train it with your existing content, and it will generate scripts that match your personality while incorporating proven viral formulas."
              },
              {
                question: "What if I don't go viral using your platform?",
                answer: "We offer a 30-day money-back guarantee. While we can't guarantee virality, we can guarantee you'll save 15+ hours per week and create higher-quality content. Our users see an average 200% increase in engagement within their first month."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Yes, absolutely. Cancel anytime with one click in your account settings. No contracts, no cancellation fees. If you cancel, you'll retain access until your current billing period ends."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to create{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              viral content
            </span>{" "}
            faster?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Stop wasting hours researching. Start creating content that actually converts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-8 py-4 h-auto hover:from-purple-700 hover:to-pink-700"
              onClick={() => setShowGooglePopup(true)}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>
            <Button 
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10 text-lg px-8 py-4 h-auto"
            >
              Contact sales
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Thousands of creators trust us
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Viraltify
              </h3>
              <p className="text-gray-400 mb-4">
                Our mission is to empower creators with AI‑powered tools to save time and go viral.
              </p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="border-gray-600 hover:border-white">
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 hover:border-white">
                  <Share className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 hover:border-white">
                  <Users className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600 hover:border-white">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <div className="space-y-2 text-gray-400">
                <p>Trend Radar</p>
                <p>Script Generator</p>
                <p>Analytics</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <div className="space-y-2 text-gray-400">
                <p>About</p>
                <p>Careers</p>
                <p>Blog</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <div className="space-y-2 text-gray-400">
                <p>Help Center</p>
                <p>Terms</p>
                <p>Privacy</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Viraltify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <GoogleSignupPopup 
        isOpen={showGooglePopup} 
        onClose={() => setShowGooglePopup(false)} 
      />
    </div>
  );
};