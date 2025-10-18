import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Check, Zap } from "lucide-react";

/**
 * Billing and Payment Page
 * Manage credits, purchase plans, and view billing history
 */
export default function Billing() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      location[1]("/");
    }
  }, [user, loading, location]);

  // Fetch user credits
  const { data: profile } = trpc.user.getProfile.useQuery();
  const { data: history } = trpc.user.getCreditHistory.useQuery({ limit: 10 });
  const buyCredits = trpc.user.buyCredits.useMutation();

  const creditPlans = [
    {
      id: "starter",
      name: "Starter",
      credits: 50,
      price: 4.99,
      popular: false,
    },
    {
      id: "professional",
      name: "Professional",
      credits: 200,
      price: 14.99,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      credits: 1000,
      price: 59.99,
      popular: false,
    },
  ];

  const handleBuyCredits = (amount: number) => {
    buyCredits.mutate({ amount });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
          <p className="text-muted-foreground">
            Manage your credits and purchase plans
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Credits */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Current Balance
              </p>
              <p className="text-4xl font-bold flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-500" />
                {profile?.credits || 0} Credits
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">
                Estimated Value
              </p>
              <p className="text-2xl font-bold">
                ${((profile?.credits || 0) * 0.1).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Credit Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`p-6 relative ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-bold">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-1">${plan.price}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.credits} credits
                </p>
                <Button
                  onClick={() => handleBuyCredits(plan.credits)}
                  disabled={buyCredits.isPending}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {buyCredits.isPending ? "Processing..." : "Buy Now"}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          {history && history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((transaction: any) => (
                    <tr key={transaction.id} className="border-b border-border">
                      <td className="py-2 px-2">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            transaction.type === "purchase"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.type === "purchase" ? "+" : "-"}
                          {Math.abs(transaction.amount)}
                        </span>
                      </td>
                      <td className="py-2 px-2">{transaction.amount}</td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          )}
        </Card>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-2">How are credits calculated?</h3>
              <p className="text-sm text-muted-foreground">
                Each thumbnail generation costs 1 credit. Advanced features may
                cost additional credits.
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-bold mb-2">Do credits expire?</h3>
              <p className="text-sm text-muted-foreground">
                Credits do not expire. They remain in your account until used.
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-bold mb-2">Can I get a refund?</h3>
              <p className="text-sm text-muted-foreground">
                Refunds are available within 30 days of purchase. Contact
                support for assistance.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

