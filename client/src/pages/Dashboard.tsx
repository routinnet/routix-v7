import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE } from "@/const";
import {
  Send,
  Plus,
  LogOut,
  Zap,
  Download,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Thumbnail {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  creditsUsed: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<Thumbnail | null>(
    null
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  // Fetch user profile
  const { data: profile } = trpc.user.getProfile.useQuery();

  // Fetch conversations
  const { data: conversations = [] } = trpc.conversation.list.useQuery();

  // Fetch thumbnails
  const { data: userThumbnails = [] } = trpc.thumbnail.getHistory.useQuery();

  // Fetch chat history when conversation changes
  const { data: chatHistory = [] } = trpc.chat.getHistory.useQuery(
    { conversationId: conversationId || "" },
    { enabled: !!conversationId }
  );

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const converted = chatHistory.map((m: any) => ({
        ...m,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      })) as Message[];
      setMessages(converted);
    }
  }, [chatHistory]);

  // Update thumbnails when they change
  useEffect(() => {
    if (userThumbnails) {
      const converted = userThumbnails.map(t => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      })) as Thumbnail[];
      setThumbnails(converted);
    }
  }, [userThumbnails]);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Refetch chat history after sending message
      if (conversationId) {
        trpc.useUtils().chat.getHistory.invalidate({ conversationId });
      }
    },
  });
  const generateThumbnailMutation = trpc.thumbnail.generate.useMutation();
  const createConversationMutation = trpc.conversation.create.useMutation({
    onSuccess: () => {
      trpc.useUtils().conversation.list.invalidate();
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !conversationId) return;

    // Message will be fetched from the query after mutation completes
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId,
        message: inputValue,
      });

      // Message will be fetched from the query
      // No need to manually add it to the state
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateThumbnail = async (prompt: string) => {
    if (!conversationId) return;

    try {
      const result = await generateThumbnailMutation.mutateAsync({
        conversationId,
        prompt,
      });

      // Add to thumbnails list
      const newThumbnail: Thumbnail = {
        id: result.thumbnailId,
        prompt,
        imageUrl: null,
        status: "generating" as const,
        creditsUsed: 2,
        createdAt: new Date().toISOString(),
      };

      setThumbnails((prev) => [newThumbnail, ...prev]);
      setSelectedThumbnail(newThumbnail);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const result = await createConversationMutation.mutateAsync({
        title: `Chat ${new Date().toLocaleDateString()}`,
      });
      if (result.conversationId) {
        setConversationId(result.conversationId);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } border-r border-slate-200 bg-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="border-b border-slate-200 p-4">
          <Button
            onClick={handleNewConversation}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Recent Chats
            </h3>
            <div className="space-y-2">
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setConversationId(conv.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    conversationId === conv.id
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Recent Thumbnails
            </h3>
            <div className="space-y-2">
              {thumbnails.slice(0, 5).map((thumb) => (
                <button
                  key={thumb.id}
                  onClick={() => setSelectedThumbnail(thumb)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedThumbnail?.id === thumb.id
                      ? "bg-purple-100 text-purple-900 font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="truncate">{thumb.prompt.substring(0, 30)}</div>
                  <div className="text-xs text-slate-500">
                    {thumb.status === "completed" ? "✓ Done" : "⏳ " + thumb.status}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Zap className="h-4 w-4" />
              {profile?.credits || 0} Credits
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {profile?.credits || 0} of {profile?.credits || 50} remaining
            </p>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 hover:text-slate-900"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-6 w-6" />}
              <h1 className="text-lg font-bold text-slate-900">{APP_TITLE}</h1>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Welcome, {user?.name || "Creator"}!
          </div>
        </header>

        {/* Content Area */}
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Start Creating
              </h2>
              <p className="mb-6 text-slate-600">
                Create a new chat to begin generating thumbnails
              </p>
              <Button
                onClick={handleNewConversation}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-hidden p-6">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-900">
                        Start a conversation
                      </h3>
                      <p className="text-slate-600">
                        Describe the thumbnail you want to create
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-900 rounded-lg px-4 py-2">
                      <div className="flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"></div>
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-100"></div>
                        <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-slate-200 p-4"
              >
                <div className="flex gap-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your thumbnail idea..."
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Thumbnail Preview */}
            <div className="w-80 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Generated Thumbnails</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {thumbnails.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <p className="text-sm text-slate-600">
                        No thumbnails yet. Ask the AI to generate one!
                      </p>
                    </div>
                  </div>
                ) : (
                  thumbnails.map((thumb) => (
                    <Card
                      key={thumb.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedThumbnail?.id === thumb.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setSelectedThumbnail(thumb)}
                    >
                      {thumb.imageUrl ? (
                        <img
                          src={thumb.imageUrl}
                          alt="Thumbnail"
                          className="mb-2 w-full rounded-md"
                        />
                      ) : (
                        <div className="mb-2 aspect-video w-full rounded-md bg-slate-100 flex items-center justify-center">
                          {thumb.status === "generating" ? (
                            <div className="text-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                              <p className="text-xs text-slate-600">Generating...</p>
                            </div>
                          ) : thumb.status === "failed" ? (
                            <p className="text-xs text-red-600">Failed</p>
                          ) : (
                            <p className="text-xs text-slate-600">Pending</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                        {thumb.prompt}
                      </p>
                      <div className="flex gap-2">
                        {thumb.imageUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
                        {thumb.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1 text-xs"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refine
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

