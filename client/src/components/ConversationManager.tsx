import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Edit2,
  Trash2,
  Download,
  MoreVertical,
  Check,
  X,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  lastMessage?: string;
}

interface ConversationManagerProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export function ConversationManager({
  conversations,
  selectedId,
  onSelect,
  onRename,
  onDelete,
  onExport,
}: ConversationManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      onRename(id, editingTitle);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
            selectedId === conversation.id
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted"
          }`}
          onClick={() => onSelect(conversation.id)}
        >
          {editingId === conversation.id ? (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit(conversation.id);
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handleSaveEdit(conversation.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.messageCount} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuId(
                      showMenuId === conversation.id ? null : conversation.id
                    );
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Context Menu */}
              {showMenuId === conversation.id && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 w-48">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(conversation);
                      setShowMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 rounded-t-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(conversation.id);
                      setShowMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conversation.id);
                      setShowMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600 flex items-center gap-2 rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

