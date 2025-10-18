import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * User Settings Page
 * Manage account preferences, notifications, and API keys
 */

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailOnGeneration: true,
    emailOnError: true,
    emailOnNewFeatures: false,
    emailOnPromotions: false,
  });

  // API keys
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; created: string }>>([
    { id: "key_1", name: "Production API Key", created: "2024-01-15" },
  ]);

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  // Profile update mutation
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handle profile update
  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: name || undefined,
        email: email || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification preference change
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Notification preference updated");
  };

  // Generate new API key
  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      created: new Date().toISOString().split("T")[0],
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setShowNewKeyForm(false);
    toast.success("API key generated successfully");
  };

  // Revoke API key
  const handleRevokeApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
    toast.success("API key revoked");
  };

  // Copy API key to clipboard
  const handleCopyApiKey = (keyId: string) => {
    navigator.clipboard.writeText(keyId);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Account Status</Label>
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    ✓ Active
                  </div>
                </div>

                <Button onClick={handleUpdateProfile} disabled={isLoading} className="w-full">
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>

            <Card className="p-6 border-red-200 bg-red-50">
              <h2 className="text-xl font-semibold mb-4 text-red-900">Danger Zone</h2>
              <p className="text-red-800 mb-4">
                Deleting your account is permanent and cannot be undone. All your data will be lost.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Thumbnail Generation Complete</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your thumbnails finish generating
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnGeneration}
                    onCheckedChange={() => handleNotificationChange("emailOnGeneration")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Generation Errors</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified if there's an error during generation
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnError}
                    onCheckedChange={() => handleNotificationChange("emailOnError")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">New Features</p>
                    <p className="text-sm text-muted-foreground">
                      Learn about new features and improvements
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnNewFeatures}
                    onCheckedChange={() => handleNotificationChange("emailOnNewFeatures")}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Special Offers</p>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional offers and discounts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnPromotions}
                    onCheckedChange={() => handleNotificationChange("emailOnPromotions")}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">API Keys</h2>
                <Button onClick={() => setShowNewKeyForm(!showNewKeyForm)} size="sm">
                  Generate New Key
                </Button>
              </div>

              {showNewKeyForm && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production, Development"
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleGenerateApiKey} size="sm">
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewKeyForm(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground">Created {key.created}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyApiKey(key.id)}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeApiKey(key.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>Security Note:</strong> Keep your API keys private. Never share them
                  publicly or commit them to version control.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Billing Information</h2>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    You are currently on the <strong>Free</strong> plan with 50 credits per month.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Upgrade Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 border-2 border-blue-200">
                      <p className="font-semibold">Pro Plan</p>
                      <p className="text-2xl font-bold my-2">$9.99/mo</p>
                      <ul className="text-sm space-y-2 mb-4">
                        <li>✓ 500 credits/month</li>
                        <li>✓ All templates</li>
                        <li>✓ Priority support</li>
                      </ul>
                      <Button className="w-full">Upgrade to Pro</Button>
                    </Card>

                    <Card className="p-4 border-2 border-purple-200">
                      <p className="font-semibold">Enterprise Plan</p>
                      <p className="text-2xl font-bold my-2">$99.99/mo</p>
                      <ul className="text-sm space-y-2 mb-4">
                        <li>✓ Unlimited credits</li>
                        <li>✓ Custom templates</li>
                        <li>✓ Dedicated support</li>
                      </ul>
                      <Button variant="outline" className="w-full">
                        Contact Sales
                      </Button>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Billing History</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Free Plan - Monthly</p>
                        <p className="text-sm text-muted-foreground">October 18, 2025</p>
                      </div>
                      <p className="font-medium">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

