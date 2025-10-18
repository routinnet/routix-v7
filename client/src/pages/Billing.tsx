import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Check, Zap, ArrowLeft, Download, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Billing and Payment Page
 * Manage credits, purchase plans, and view billing history
 */
export default function Billing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("plans");

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Fetch user credits
  const { data: profile } = trpc.user.getProfile.useQuery();
  const { data: history } = trpc.user.getCreditHistory.useQuery({});
  const buyCredits = trpc.user.buyCredits.useMutation({
    onSuccess: () => {
      toast.success("Credits purchased successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const creditPlans = [
    {
      id: "starter",
      name: "Starter",
      credits: 100,
      price: 9.99,
      popular: false,
      features: ["100 Credits", "Valid for 30 days", "Email support"],
    },
    {
      id: "professional",
      name: "Professional",
      credits: 500,
      price: 39.99,
      popular: true,
      features: ["500 Credits", "Valid for 60 days", "Priority support", "Advanced analytics"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 2000,
      price: 129.99,
      popular: false,
      features: ["2000 Credits", "Valid for 180 days", "24/7 support", "API access"],
    },
  ];

  const subscriptionPlans = [
    {
      id: "free",
      name: "Free",
      price: "Free",
      credits: "50/month",
      features: ["50 credits per month", "Basic support", "Community access"],
      current: user?.subscriptionStatus === "free",
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19.99/month",
      credits: "500/month",
      features: ["500 credits per month", "Priority support", "Advanced templates", "API access"],
      current: user?.subscriptionStatus === "pro",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$99.99/month",
      credits: "5000/month",
      features: ["5000 credits per month", "24/7 support", "Custom templates", "Dedicated account manager"],
      current: user?.subscriptionStatus === "enterprise",
    },
  ];

  const handleBuyCredits = (planId: string) => {
    const plan = creditPlans.find((p) => p.id === planId);
    if (plan) {
      buyCredits.mutate({ amount: plan.price });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Billing & Credits</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600">Current Credits</p>
              <p className="text-2xl font-bold text-blue-600">{profile?.credits || user?.credits || 0}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Credit Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Credit Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Buy Credits</h2>
              <p className="text-gray-600">Choose a plan that fits your needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative p-6 bg-white/50 backdrop-blur-sm border transition-all ${
                    plan.popular
                      ? "border-blue-300 ring-2 ring-blue-100 md:scale-105"
                      : "border-blue-100/50 hover:border-blue-300/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-800">${plan.price}</span>
                      <span className="text-gray-600">/one-time</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{plan.credits} Credits</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleBuyCredits(plan.id)}
                    disabled={buyCredits.isPending}
                  >
                    {buyCredits.isPending ? "Processing..." : "Buy Now"}
                  </Button>
                </Card>
              ))}
            </div>

            {/* Credit Info */}
            <Card className="p-6 bg-blue-50/50 backdrop-blur-sm border-blue-100">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">How Credits Work</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Each thumbnail generation costs 1 credit</li>
                    <li>• Credits never expire when you have an active subscription</li>
                    <li>• Unused credits from one-time purchases expire after 30 days</li>
                    <li>• Refunds are available within 7 days of purchase</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Subscription Plans</h2>
              <p className="text-gray-600">Get recurring credits every month</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative p-6 bg-white/50 backdrop-blur-sm border transition-all ${
                    plan.current
                      ? "border-green-300 ring-2 ring-green-100"
                      : "border-blue-100/50 hover:border-blue-300/50"
                  }`}
                >
                  {plan.current && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-800 mb-2">{plan.price}</div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">{plan.credits} Credits</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={plan.current ? "outline" : "default"}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : "Upgrade"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Transaction History</h2>
                <p className="text-gray-600 mt-1">View your credit purchases and usage</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credits</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!history || history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>No transactions yet</p>
                        </td>
                      </tr>
                    ) : (
                      history.map((transaction: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                            {transaction.type || "Purchase"}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                            {transaction.type === "purchase" ? "+" : "-"}
                            {transaction.amount}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            ${transaction.price ? transaction.price.toFixed(2) : "0.00"}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                transaction.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {transaction.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Invoice Section */}
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Need an Invoice?</h3>
                  <p className="text-sm text-gray-600 mt-1">Download invoices for your records</p>
                </div>
                <Button variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

