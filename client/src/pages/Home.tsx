import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Sparkles, Zap, Palette, Download } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  if (isAuthenticated && !loading) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">{user?.name || "User"}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              AI-Powered Thumbnail Generation
            </span>
          </div>

          <h2 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Create Stunning Thumbnails with AI
          </h2>

          <p className="mb-8 text-xl text-slate-600 max-w-2xl mx-auto">
            Routix empowers content creators to generate, customize, and refine
            professional thumbnails through natural language conversations. No
            design skills required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const element = document.getElementById("features");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Powerful Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="p-6 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                Conversational AI
              </h4>
              <p className="text-sm text-slate-600">
                Chat naturally with our AI to describe your thumbnail ideas and
                get instant feedback.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                AI Image Generation
              </h4>
              <p className="text-sm text-slate-600">
                Leverage cutting-edge AI models to generate high-quality,
                unique thumbnails instantly.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                Quick Customization
              </h4>
              <p className="text-sm text-slate-600">
                Refine colors, text, positioning, and more with intuitive
                editing tools.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 border-slate-200 hover:shadow-lg transition-shadow">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                One-Click Download
              </h4>
              <p className="text-sm text-slate-600">
                Export your perfect thumbnail in multiple formats and
                resolutions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h3 className="mb-12 text-center text-3xl font-bold text-slate-900">
            How It Works
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                1
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                Describe Your Vision
              </h4>
              <p className="text-sm text-slate-600">
                Chat with our AI about what you want in your thumbnail. Be as
                specific or creative as you like.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                2
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                AI Generates
              </h4>
              <p className="text-sm text-slate-600">
                Our AI instantly creates a professional thumbnail based on your
                description and preferences.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                3
              </div>
              <h4 className="mb-2 font-semibold text-slate-900">
                Download & Use
              </h4>
              <p className="text-sm text-slate-600">
                Download your thumbnail and use it across all your platforms.
                Refine anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Simple, Transparent Pricing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8 border-slate-200">
              <h4 className="mb-2 text-xl font-bold text-slate-900">Free</h4>
              <p className="mb-6 text-sm text-slate-600">Get started</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-600"></span>
                  50 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-600"></span>
                  Basic templates
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-600"></span>
                  Chat support
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-blue-200 bg-blue-50 relative">
              <div className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1">
                <span className="text-xs font-semibold text-blue-600">
                  Popular
                </span>
              </div>
              <h4 className="mb-2 text-xl font-bold text-slate-900">Pro</h4>
              <p className="mb-6 text-sm text-slate-600">For creators</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">$9</span>
                <span className="text-slate-600">/month</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  500 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  All templates
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  Priority support
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-8 border-slate-200">
              <h4 className="mb-2 text-xl font-bold text-slate-900">
                Enterprise
              </h4>
              <p className="mb-6 text-sm text-slate-600">Custom solution</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">Custom</span>
              </div>
              <ul className="mb-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                  Unlimited credits
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                  Custom templates
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                  Dedicated support
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="mb-4 text-3xl font-bold text-white">
            Ready to Create Amazing Thumbnails?
          </h3>
          <p className="mb-8 text-lg text-blue-100">
            Join thousands of creators using Routix to boost their content
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Start Creating Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600">
          <p>© 2024 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

