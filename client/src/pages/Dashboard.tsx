import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
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
  Search,
  Trash2,
  Edit2,
  Copy,
  MoreVertical,
  Sparkles,
  Clock,
  TrendingUp,
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

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
}

const QUICK_PROMPTS = [
  {
    icon: "✨",
    title: "Professional",
    description: "Create professional business thumbnails",
    prompt: "Create a professional business thumbnail with modern design",
  },
  {
    icon: "🎬",
    title: "YouTube",
    description: "Optimize for YouTube videos",
    prompt: "Design an eye-catching YouTube thumbnail with bold colors",
  },
  {
    icon: "📱",
    title: "Social Media",
    description: "Perfect for Instagram/TikTok",
    prompt: "Create a trendy social media thumbnail with current design trends",
  },
  {
    icon: "🎨",
    title: "Creative",
    description: "Artistic and unique designs",
    prompt: "Design a creative and artistic thumbnail with unique elements",
  },
  {
    icon: "🏢",
    title: "Corporate",
    description: "Corporate branding style",
    prompt: "Create a corporate branded thumbnail with company colors",
  },
  {
    icon: "🎯",
    title: "Promotional",
    description: "Sales and promotional content",
    prompt: "Design a promotional thumbnail that drives engagement",
  },
];

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [, navigate] = useLocation();

  // State management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<Thumbnail | null>(
    null
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  // Ref to track if component is mounted
  const isMounted = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
    return () => {
      isMounted.current = false;
    };
  }, [loading, user, navigate]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Don't render if loading or not authenticated
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      setConversationId(null);
      setMessages([]);
      setInputValue("");
      setShowQuickPrompts(true);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    setShowQuickPrompts(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowQuickPrompts(false);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate AI response with typing effect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm generating your thumbnail based on your description. This will be processed by our AI image generation service. Your thumbnail will appear in the right panel once ready.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Add a sample thumbnail
      const newThumbnail: Thumbnail = {
        id: Date.now().toString(),
        prompt: userMessage.content,
        imageUrl: null,
        status: "generating",
        creditsUsed: 1,
        createdAt: new Date().toISOString(),
      };
      setThumbnails((prev) => [newThumbnail, ...prev]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleDownloadThumbnail = (thumbnail: Thumbnail) => {
    if (thumbnail.imageUrl) {
      const link = document.createElement("a");
      link.href = thumbnail.imageUrl;
      link.download = `thumbnail-${thumbnail.id}.png`;
      link.click();
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationId === id) {
      handleNewChat();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white/80 backdrop-blur-sm border-r border-blue-100/50 transition-all duration-300 overflow-hidden flex flex-col shadow-sm`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-blue-100/30">
          <Button
            onClick={handleNewChat}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-blue-100/30">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-white/50 border-blue-100/50 rounded-lg focus:bg-white focus:border-blue-300"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    conversationId === conv.id
                      ? "bg-blue-100/50 border border-blue-200/50"
                      : "hover:bg-white/50"
                  }`}
                  onClick={() => setConversationId(conv.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-800">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.messageCount} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuId(
                          showMenuId === conv.id ? null : conv.id
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Context Menu */}
                  {showMenuId === conv.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-blue-100/50 rounded-xl shadow-lg z-10 w-40 backdrop-blur-sm">
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 rounded-t-lg text-gray-700">
                        <Edit2 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                          setShowMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credits and Logout */}
        <div className="border-t border-blue-100/30 p-4 space-y-3">
          <div className="bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-gray-800">
                {user.credits} Credits
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {user.credits} of {user.credits} remaining
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs border-blue-200/50 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Buy Credits
            </Button>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full border-blue-200/50 text-gray-700 hover:bg-blue-50 rounded-lg"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-blue-100/30 p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-blue-50 rounded-lg"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              {APP_LOGO && (
                <img src={APP_LOGO} alt="Logo" className="w-6 h-6 rounded" />
              )}
              <div>
            <h1 className="font-bold text-2xl text-gray-800 animate-fadeInDown" style={{fontFamily: "'Playfair Display', serif"}}>Routix</h1>
            <p className="text-xs text-gray-500 animate-fadeInUp">
              AI-Powered Thumbnail Generation
            </p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-medium text-gray-800">{user.name}</span>!
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {/* Quick Prompts */}
            {showQuickPrompts && messages.length === 0 && (
              <div className="flex-1 flex flex-col justify-center pb-8">
                <div className="mb-8">
                  <h2 className="text-5xl font-bold text-gray-800 mb-2 animate-fadeInUp" style={{fontFamily: "'Playfair Display', serif"}}>
                    What would you like to create?
                  </h2>
                  <p className="text-gray-600">
                    Choose a style or describe your ideal thumbnail
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-100/50 cursor-pointer hover:border-blue-300/50 hover:shadow-md transition-all group"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                    >
                      <div className="text-2xl mb-2">{prompt.icon}</div>
                      <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-smooth" style={{fontFamily: "'Playfair Display', serif"}}>
                        {prompt.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {prompt.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!showQuickPrompts && (
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                      <h2 className="text-4xl font-bold text-gray-800 mb-2 animate-fadeInUp" style={{fontFamily: "'Playfair Display', serif"}}>
                        Start Creating
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Describe the thumbnail you want to create
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-blue-500 text-white rounded-br-none shadow-sm"
                              : "bg-white/50 backdrop-blur-sm text-gray-800 border border-blue-100/50 rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {msg.content}
                          </p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/50 backdrop-blur-sm text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none border border-blue-100/50">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe the thumbnail you want to create..."
                className="flex-1 min-h-24 resize-none bg-white/50 backdrop-blur-sm border-blue-100/50 rounded-xl focus:bg-white focus:border-blue-300"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="self-end bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Thumbnails Panel */}
          <div className="w-80 border-l border-blue-100/30 pl-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800">Generated Thumbnails</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {thumbnails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Sparkles className="w-8 h-8 text-blue-200 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No thumbnails yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Start chatting to generate
                    </p>
                  </div>
                </div>
              ) : (
                thumbnails.map((thumb) => (
                  <div
                    key={thumb.id}
                    className={`p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-100/50 cursor-pointer transition-all hover:shadow-md ${
                      selectedThumbnail?.id === thumb.id
                        ? "ring-2 ring-blue-400 shadow-md"
                        : ""
                    }`}
                    onClick={() => setSelectedThumbnail(thumb)}
                  >
                    <div className="relative mb-2 bg-gray-100 rounded-lg h-32 flex items-center justify-center overflow-hidden">
                      {thumb.imageUrl ? (
                        <img
                          src={thumb.imageUrl}
                          alt={thumb.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          {thumb.status === "generating" && (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                              <p className="text-xs text-gray-600">
                                Generating...
                              </p>
                            </>
                          )}
                          {thumb.status === "failed" && (
                            <p className="text-xs text-red-600">Failed</p>
                          )}
                          {thumb.status === "pending" && (
                            <p className="text-xs text-gray-600">Pending</p>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate text-gray-800 mb-1">
                      {thumb.prompt}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      {thumb.creditsUsed} credits
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 border-blue-200/50 text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadThumbnail(thumb);
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 border-blue-200/50 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

