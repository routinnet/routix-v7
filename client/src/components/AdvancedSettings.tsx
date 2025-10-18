import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SettingsProps {
  quality: "draft" | "standard" | "premium";
  style: string;
  size: string;
  onQualityChange: (quality: "draft" | "standard" | "premium") => void;
  onStyleChange: (style: string) => void;
  onSizeChange: (size: string) => void;
  onClose: () => void;
}

export function AdvancedSettings({
  quality,
  style,
  size,
  onQualityChange,
  onStyleChange,
  onSizeChange,
  onClose,
}: SettingsProps) {
  const qualities = [
    { value: "draft", label: "Draft", description: "Fast, lower quality" },
    { value: "standard", label: "Standard", description: "Balanced quality & speed" },
    { value: "premium", label: "Premium", description: "Highest quality" },
  ];

  const styles = [
    "Professional",
    "YouTube",
    "Social Media",
    "Creative",
    "Corporate",
    "Artistic",
    "Minimalist",
    "Vibrant",
  ];

  const sizes = [
    { value: "1280x720", label: "HD (1280x720)" },
    { value: "1920x1080", label: "Full HD (1920x1080)" },
    { value: "2560x1440", label: "2K (2560x1440)" },
    { value: "1024x1024", label: "Square (1024x1024)" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-md border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Advanced Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Quality Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Quality Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  onClick={() => onQualityChange(q.value as "draft" | "standard" | "premium")}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    quality === q.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-semibold text-gray-800">{q.label}</p>
                  <p className="text-xs text-gray-600">{q.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => onStyleChange(s)}
                  className={`p-2 rounded-lg border-2 transition-all text-sm ${
                    style === s
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">Size</label>
            <div className="grid grid-cols-2 gap-3">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onSizeChange(s.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    size === s.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-semibold text-gray-800">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              💡 <strong>Note:</strong> Premium quality and larger sizes may take longer to
              generate and use more credits.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

