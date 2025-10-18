import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  quality: "draft" | "standard" | "premium";
  costPerGeneration: number;
}

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
  onClose,
}: ModelSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-md border-slate-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Select AI Model</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  onClose();
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedModel === model.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{model.name}</h3>
                    <p className="text-xs text-gray-600">{model.provider}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    {model.costPerGeneration}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      model.quality === "premium"
                        ? "bg-purple-100 text-purple-700"
                        : model.quality === "standard"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {model.quality.charAt(0).toUpperCase() + model.quality.slice(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              💡 <strong>Tip:</strong> Different models have different strengths. Premium models
              provide higher quality but cost more credits. Choose based on your needs.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

