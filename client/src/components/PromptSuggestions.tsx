import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, TrendingUp, Lightbulb } from "lucide-react";

interface PromptSuggestion {
  icon: string;
  title: string;
  description: string;
  prompt: string;
  category: "trending" | "popular" | "suggested" | "custom";
}

interface PromptSuggestionsProps {
  suggestions: PromptSuggestion[];
  onSelectPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptSuggestions({
  suggestions,
  onSelectPrompt,
  isLoading = false,
}: PromptSuggestionsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trending":
        return <TrendingUp className="w-4 h-4" />;
      case "popular":
        return <Zap className="w-4 h-4" />;
      case "suggested":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Suggested Prompts</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((suggestion, idx) => (
          <Card
            key={idx}
            className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => onSelectPrompt(suggestion.prompt)}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{suggestion.icon}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                {getCategoryIcon(suggestion.category)}
                {suggestion.category}
              </span>
            </div>
            <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {suggestion.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              {suggestion.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              Use This
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

