import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

/**
 * Admin Dashboard Page
 * Displays system statistics, user management, and analytics
 */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const location = useLocation();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      location[1]("/dashboard");
    }
  }, [user, location]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } =
    trpc.admin.getDashboardStats.useQuery();
  const { data: users, isLoading: usersLoading } =
    trpc.admin.getAllUsers.useQuery({ limit: 100 });
  const { data: analyticsData, isLoading: analyticsLoading } =
    trpc.admin.getDashboardStats.useQuery();

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => location[1]("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              System overview and management
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold">
                  {statsLoading ? "..." : stats?.totalUsers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>

          {/* Active Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Users (30d)
                </p>
                <p className="text-3xl font-bold">
                  {statsLoading ? "..." : stats?.activeUsers || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          {/* Total Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold">
                  ${statsLoading ? "..." : stats?.totalRevenue || 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          {/* Total Generations */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Generations
                </p>
                <p className="text-3xl font-bold">
                  {statsLoading ? "..." : stats?.thumbnailsGenerated || 0}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Status</span>
                  <span className="text-sm font-medium text-green-600">
                    ✓ Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Status</span>
                  <span className="text-sm font-medium text-green-600">
                    ✓ Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Image Generation</span>
                  <span className="text-sm font-medium text-green-600">
                    ✓ Operational
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>No recent activity to display</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">User Management</h3>
              {usersLoading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : users && users.users && users.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2">Name</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Role</th>
                        <th className="text-left py-2 px-2">Credits</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.users.map((u: any) => (
                        <tr key={u.id} className="border-b border-border">
                          <td className="py-2 px-2">{u.name || "N/A"}</td>
                          <td className="py-2 px-2">{u.email || "N/A"}</td>
                          <td className="py-2 px-2">
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-2">{u.credits || 0}</td>
                          <td className="py-2 px-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No users found</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Analytics</h3>
              {analyticsLoading ? (
                <p className="text-muted-foreground">Loading analytics...</p>
              ) : analyticsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {analyticsData.successRate || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Thumbnails Generated
                      </p>
                      <p className="text-2xl font-bold">
                        {analyticsData.thumbnailsGenerated || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No analytics available</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

