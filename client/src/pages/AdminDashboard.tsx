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
  Search,
  Trash2,
  Shield,
  Download,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Admin Dashboard Page
 * Displays system statistics, user management, and analytics
 */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch admin data
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: allUsersData, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery({});
  const allUsers = Array.isArray(allUsersData) ? allUsersData : allUsersData?.users || [];
  const updateUserRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter users based on search
  const filteredUsers = allUsers.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate({ userId });
    }
  };

  const handlePromoteUser = (userId: string) => {
    updateUserRoleMutation.mutate({ userId, role: "admin" });
  };

  const handleDemoteUser = (userId: string) => {
    updateUserRoleMutation.mutate({ userId, role: "user" });
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
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
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.name || "Admin"}</span>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users Card */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50 hover:border-blue-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {analytics?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </Card>

              {/* Active Users Card */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-green-100/50 hover:border-green-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {analytics?.activeUsers || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-200" />
                </div>
              </Card>

              {/* Total Revenue Card */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-purple-100/50 hover:border-purple-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      ${analytics?.totalRevenue || 0}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-purple-200" />
                </div>
              </Card>

              {/* Generations Card */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-orange-100/50 hover:border-orange-300/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Thumbnails Generated</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {analytics?.thumbnailsGenerated || 0}
                    </p>
                  </div>
                  <Zap className="w-12 h-12 text-orange-200" />
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">System Health</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Database Health</span>
                    <span className="text-sm font-semibold text-green-600">Healthy</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <span className="text-sm font-semibold text-blue-600">45ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Server Load</span>
                    <span className="text-sm font-semibold text-yellow-600">62%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "62%" }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
              <div className="flex items-center gap-4 mb-6">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credits</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u: any) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-800">{u.name || "N/A"}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{u.email || "N/A"}</td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800">{u.credits || 0}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              {u.role === "admin" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDemoteUser(u.id)}
                                >
                                  Demote
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePromoteUser(u.id)}
                                >
                                  Promote
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generation Stats */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Generation Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Thumbnails</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {analytics?.thumbnailsGenerated || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            ((analytics?.thumbnailsGenerated || 0) / 1000) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-semibold text-green-600">
                        {analytics?.successRate ? (analytics.successRate * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Revenue Stats */}
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-purple-100/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-sm font-semibold text-gray-800">
                        ${analytics?.totalRevenue || 0}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Average User Value</span>
                      <span className="text-sm font-semibold text-blue-600">
                        ${analytics?.averageUserValue || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Export Data */}
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
                  <p className="text-sm text-gray-600 mt-1">Download analytics and reports</p>
                </div>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

