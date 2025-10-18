import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Send,
  Plus,
  Menu,
  Settings,
  LogOut,
  Upload,
  Download,
  Trash2,
  Copy,
  RotateCcw,
  Zap,
  MessageCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thumbnail?: {
    id: string;
    imageUrl: string;
    prompt: string;
  };
  timestamp: Date;
}

/**
 * ChatGPT-style Dashboard
 * All features integrated into conversation flow
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const { data: conversationsList } = trpc.conversation.list.useQuery();
  const createConversationMutation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      setMessages([]);
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (response: any) => {
      // Add AI response
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: response.response,
        thumbnail: response.thumbnail,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update conversations list
  useEffect(() => {
    if (conversationsList) {
      setConversations(conversationsList);
    }
  }, [conversationsList]);

  const handleNewChat = () => {
    createConversationMutation.mutate({ title: `Chat ${new Date().toLocaleDateString()}` });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversationId) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Send to AI
    sendMessageMutation.mutate({
      conversationId: currentConversationId,
      message: inputValue,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, just show a message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: `📎 Uploaded: ${file.name}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    toast.success(`File uploaded: ${file.name}`);
  };

  const handleDownloadThumbnail = (thumbnail: any) => {
    // Create a link and download
    const link = document.createElement("a");
    link.href = thumbnail.imageUrl;
    link.download = `thumbnail-${Date.now()}.png`;
    link.click();
    toast.success("Thumbnail downloaded!");
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (confirm("Delete this conversation?")) {
      // TODO: Implement delete mutation
      toast.success("Conversation deleted");
    }
  };

  const handleRegenerateImage = (message: Message) => {
    if (message.thumbnail) {
      setInputValue(`Regenerate: ${message.content}`);
    }
  };

  if (!currentConversationId && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <MessageCircle className="w-16 h-16 text-blue-600 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Routix</h1>
          <p className="text-gray-600 mb-8">
            Start creating amazing thumbnails with AI. Just describe what you want!
          </p>
          <Button onClick={handleNewChat} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white/50 backdrop-blur-md border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <Button onClick={handleNewChat} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3">Recent Chats</p>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentConversationId === conv.id
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <p className="text-sm truncate">{conv.title}</p>
              <p className="text-xs text-gray-500">
                {new Date(conv.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 justify-start text-red-600 hover:text-red-700"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/50 backdrop-blur-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Routix</h1>
              <p className="text-xs text-gray-600">AI-Powered Thumbnail Generation</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Zap className="w-4 h-4" />
                {user?.credits || 0} Credits
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Start by describing the thumbnail you want to create...
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                      : "bg-white/50 backdrop-blur-sm border border-slate-200 text-gray-800 rounded-2xl rounded-tl-none"
                  } p-4 space-y-3`}
                >
                  {/* Message Text */}
                  <p className="text-sm">{message.content}</p>

                  {/* Generated Thumbnail */}
                  {message.thumbnail && (
                    <div className="space-y-3">
                      <img
                        src={message.thumbnail.imageUrl}
                        alt="Generated thumbnail"
                        className="w-full rounded-lg border border-gray-200"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={message.role === "user" ? "secondary" : "outline"}
                          className="gap-2 flex-1"
                          onClick={() => handleDownloadThumbnail(message.thumbnail)}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant={message.role === "user" ? "secondary" : "outline"}
                          className="gap-2 flex-1"
                          onClick={() => handleRegenerateImage(message)}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/50 backdrop-blur-sm border border-slate-200 text-gray-800 rounded-2xl rounded-tl-none p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white/50 backdrop-blur-md p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Quick Prompts */}
            {messages.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { icon: "✨", label: "Professional", prompt: "Create a professional business thumbnail" },
                  { icon: "🎬", label: "YouTube", prompt: "Design a YouTube video thumbnail" },
                  { icon: "📱", label: "Social Media", prompt: "Make a social media thumbnail" },
                  { icon: "🎨", label: "Creative", prompt: "Generate a creative artistic thumbnail" },
                  { icon: "🏢", label: "Corporate", prompt: "Design a corporate branding thumbnail" },
                  { icon: "🎯", label: "Promotional", prompt: "Create a promotional thumbnail" },
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(prompt.prompt)}
                    className="p-3 bg-white/50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <p className="text-xl mb-1">{prompt.icon}</p>
                    <p className="text-xs font-semibold text-gray-700">{prompt.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div className="flex gap-3">
              <div className="flex-1 flex gap-2 bg-white/50 border border-slate-200 rounded-full px-4 py-3 backdrop-blur-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <Upload className="w-5 h-5" />
                </Button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Describe the thumbnail you want to create..."
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500"
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="text-blue-600 hover:text-blue-700 bg-transparent hover:bg-transparent"
                  variant="ghost"
                  size="sm"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Each generation costs 1 credit. You have {user?.credits || 0} credits remaining.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

