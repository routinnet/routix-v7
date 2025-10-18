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
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<Thumbnail | null>(null);
  
  // Ref to track if component is mounted
  const isMounted = useRef(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
    return () => {
      isMounted.current = false;
    };
  }, [loading, user, navigate]);

  // Don't render if loading or not authenticated
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      // Create new conversation
      setConversationId(null);
      setMessages([]);
      setInputValue("");
    } finally {
      setIsLoading(false);
    }
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
    setIsLoading(true);

    try {
      // Simulate AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm processing your request. This is a placeholder response.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-border">
          <Button
            onClick={handleNewChat}
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
            Recent Chats
          </p>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground p-2 rounded hover:bg-muted cursor-pointer">
              Chat 10/18/2025
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground mb-3 mt-6 uppercase">
            Recent Thumbnails
          </p>
          <div className="space-y-2">
            {thumbnails.length === 0 ? (
              <p className="text-xs text-muted-foreground">No thumbnails yet</p>
            ) : (
              thumbnails.map((thumb) => (
                <div
                  key={thumb.id}
                  className="text-sm text-muted-foreground p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedThumbnail(thumb)}
                >
                  {thumb.prompt.substring(0, 20)}...
                </div>
              ))
            )}
          </div>
        </div>

        {/* Credits and Logout */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="bg-muted p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold">{user.credits} Credits</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {user.credits} of {user.credits} remaining
            </p>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              {APP_LOGO && (
                <img
                  src={APP_LOGO}
                  alt="Logo"
                  className="w-6 h-6 rounded"
                />
              )}
              <h1 className="font-bold text-lg">{APP_TITLE}</h1>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Welcome, {user.name}!
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Start Creating</h2>
                    <p className="text-muted-foreground mb-4">
                      Create a new chat to begin generating thumbnails
                    </p>
                    <Button onClick={handleNewChat} disabled={isLoading}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
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
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

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
                className="flex-1 min-h-24"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Thumbnails Panel */}
          <div className="w-80 border-l border-border pl-4 flex flex-col">
            <h3 className="font-bold mb-4">Generated Thumbnails</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {thumbnails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <p className="text-muted-foreground">No thumbnails yet</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Generate thumbnails by chatting with the AI
                    </p>
                  </div>
                </div>
              ) : (
                thumbnails.map((thumb) => (
                  <Card
                    key={thumb.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedThumbnail?.id === thumb.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedThumbnail(thumb)}
                  >
                    {thumb.imageUrl && (
                      <img
                        src={thumb.imageUrl}
                        alt={thumb.prompt}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <p className="text-xs font-medium truncate">
                      {thumb.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {thumb.creditsUsed} credits
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
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
                        className="flex-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

