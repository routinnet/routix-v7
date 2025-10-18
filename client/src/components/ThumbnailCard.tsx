import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ThumbnailCardProps {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  creditsUsed: number;
  createdAt: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ThumbnailCard({
  id,
  prompt,
  imageUrl,
  status,
  creditsUsed,
  createdAt,
  isSelected = false,
  onSelect,
  onDownload,
  onCopy,
  onShare,
  onEdit,
  onDelete,
}: ThumbnailCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle className="w-5 h-5 text-green-500 absolute top-2 right-2" />
        );
      case "failed":
        return (
          <AlertCircle className="w-5 h-5 text-red-500 absolute top-2 right-2" />
        );
      case "generating":
        return (
          <Clock className="w-5 h-5 text-blue-500 absolute top-2 right-2 animate-spin" />
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "generating":
        return "Generating...";
      default:
        return "Pending";
    }
  };

  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:shadow-md group relative ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={onSelect}
    >
      {/* Image Container */}
      <div className="relative mb-2 bg-muted rounded h-32 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-shadow">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </>
        ) : (
          <div className="text-center">
            {status === "generating" && (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Generating...</p>
              </>
            )}
            {status === "failed" && (
              <p className="text-xs text-red-600">Generation failed</p>
            )}
            {status === "pending" && (
              <p className="text-xs text-muted-foreground">Pending</p>
            )}
          </div>
        )}
        {getStatusIcon()}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium truncate" title={prompt}>
            {prompt}
          </p>
          <p className="text-xs text-muted-foreground">
            {creditsUsed} credits • {getStatusText()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === "completed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload?.();
                }}
                title="Download"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy?.();
                }}
                title="Copy"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </>
          )}
          {status !== "completed" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              disabled
            >
              Processing...
            </Button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 w-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 rounded-t-lg"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
              setShowMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-red-600 flex items-center gap-2 rounded-b-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </Card>
  );
}

