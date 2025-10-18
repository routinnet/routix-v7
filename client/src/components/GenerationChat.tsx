import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, RefreshCw, Download, Share2, Zap, Clock, Star } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface GenerationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  generationId?: string;
  timestamp: Date;
  metadata?: {
    qualityScore?: number;
    creditsUsed?: number;
    model?: string;
    referenceId?: string;
  };
}

interface GenerationPreview {
  isGenerating: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  estimatedTime: number;
}

export function GenerationChat() {
  const [messages, setMessages] = useState<GenerationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<GenerationPreview>({
    isGenerating: false,
    progress: 0,
    currentStep: 0,
    totalSteps: 8,
    estimatedTime: 0,
  });
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: GenerationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Start generation
    setPreview({
      isGenerating: true,
      progress: 0,
      currentStep: 1,
      totalSteps: 8,
      estimatedTime: 30,
    });

    // Simulate progress
    const progressInterval = setInterval(() => {
      setPreview((prev) => {
        const newProgress = Math.min(prev.progress + Math.random() * 15, 95);
        const newStep = Math.ceil((newProgress / 100) * 8);
        return {
          ...prev,
          progress: newProgress,
          currentStep: newStep,
        };
      });
    }, 1000);

    try {
      // TODO: Call generation API when router is ready
      // Simulate successful generation for now
      setTimeout(() => {
        const assistantMessage: GenerationMessage = {
          id: `gen_${Date.now()}`,
          role: 'assistant',
          content: `Generated thumbnail for: ${inputValue}`,
          imageUrl: 'https://via.placeholder.com/1280x720?text=Generated+Thumbnail',
          timestamp: new Date(),
          metadata: {
            qualityScore: 0.85,
            creditsUsed: 10,
            model: 'DALL-E 3',
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setPreview({
          isGenerating: false,
          progress: 100,
          currentStep: 8,
          totalSteps: 8,
          estimatedTime: 0,
        });
      }, 3000);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImages((prev) => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegenerateWithStyle = (style: string) => {
    const prompt = `${inputValue} in ${style} style`;
    setInputValue(prompt);
  };

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `routix-thumbnail-${Date.now()}.png`;
    link.click();
  };

  const handleShareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my Routix thumbnail!',
          text: 'Generated with Routix AI',
          url: imageUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const steps = [
    'Validating Request',
    'AI Analysis',
    'Reference Selection',
    'Prompt Engineering',
    'Generating Image',
    'Post-Production',
    'Quality Check',
    'Delivery',
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Routix</h2>
                <p className="text-gray-400">
                  Describe your YouTube thumbnail and let AI create it for you
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-lg rounded-tr-none'
                      : 'bg-slate-800 text-gray-100 rounded-lg rounded-tl-none'
                  } p-4`}
                >
                  <p className="text-sm mb-2">{message.content}</p>

                  {message.imageUrl && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={message.imageUrl}
                        alt="Generated thumbnail"
                        className="w-full rounded-lg border border-purple-500/30"
                      />

                      {message.metadata && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 bg-black/30 p-2 rounded">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Quality: {(message.metadata.qualityScore! * 100).toFixed(0)}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Credits: {message.metadata.creditsUsed}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadImage(message.imageUrl!)}
                          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 rounded transition"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button
                          onClick={() => handleShareImage(message.imageUrl!)}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded transition"
                        >
                          <Share2 className="w-3 h-3" />
                          Share
                        </button>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {['dramatic', 'minimalist', 'colorful'].map((style) => (
                          <button
                            key={style}
                            onClick={() => handleRegenerateWithStyle(style)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 px-2 py-1 rounded transition capitalize"
                          >
                            Try {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Generation Progress */}
          {preview.isGenerating && (
            <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm font-semibold text-white">
                  {steps[preview.currentStep - 1]}...
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${preview.progress}%` }}
                />
              </div>

              {/* Step Indicators */}
              <div className="grid grid-cols-8 gap-1">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index < preview.currentStep
                        ? 'bg-purple-500'
                        : index === preview.currentStep - 1
                        ? 'bg-purple-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Step {preview.currentStep} of {preview.totalSteps}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4 bg-slate-800/50 backdrop-blur">
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 mb-3 pb-3 border-b border-slate-700 overflow-x-auto">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Upload ${idx}`}
                    className="w-16 h-16 rounded border border-purple-500/30 object-cover"
                  />
                  <button
                    onClick={() =>
                      setUploadedImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer transition">
              <Upload className="w-5 h-5 text-gray-300" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your thumbnail idea..."
              className="flex-1 bg-slate-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || preview.isGenerating}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white transition"
            >
              {preview.isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generation History Sidebar */}
      <div className="w-64 border-l border-slate-700 bg-slate-800/50 backdrop-blur flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-semibold text-white">Generation History</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages
            .filter((m) => m.role === 'assistant' && m.imageUrl)
            .reverse()
            .map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedGeneration(msg)}
                className={`w-full text-left p-2 rounded-lg transition ${
                  selectedGeneration?.id === msg.id
                    ? 'bg-purple-600/30 border border-purple-500'
                    : 'bg-slate-700 hover:bg-slate-600 border border-transparent'
                }`}
              >
                <div className="flex gap-2">
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="History"
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-gray-400">
                        {(msg.metadata?.qualityScore! * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default GenerationChat;

