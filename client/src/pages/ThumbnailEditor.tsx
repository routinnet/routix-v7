import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, Download, RotateCcw, Save } from "lucide-react";

/**
 * Advanced Thumbnail Editor
 * Allows users to edit generated thumbnails with various tools
 */

interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  textOverlay: string;
  textColor: string;
  textSize: number;
  textPosition: "top" | "center" | "bottom";
  backgroundColor: string;
  borderRadius: number;
  scale: number;
}

export default function ThumbnailEditor() {
  const [location, setLocation] = useLocation();
  const thumbnailId = location.split("/").pop() || "";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    textOverlay: "",
    textColor: "#FFFFFF",
    textSize: 48,
    textPosition: "center",
    backgroundColor: "transparent",
    borderRadius: 0,
    scale: 100,
  });

  const { data: thumbnail } = trpc.thumbnail.getStatus.useQuery({
    thumbnailId: thumbnailId,
  });

  // Load image
  useEffect(() => {
    if (!thumbnail?.imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setOriginalImage(img);
      redrawCanvas(img, editorState);
    };
    img.src = thumbnail.imageUrl;
  }, [thumbnail?.imageUrl]);

  // Redraw canvas with current editor state
  const redrawCanvas = (img: HTMLImageElement, state: EditorState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Apply filters
    const filterString = `
      brightness(${state.brightness}%)
      contrast(${state.contrast}%)
      saturate(${state.saturation}%)
      hue-rotate(${state.hue}deg)
      blur(${state.blur}px)
    `;

    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0);

    // Reset filter for text
    ctx.filter = "none";

    // Draw text overlay if provided
    if (state.textOverlay) {
      const textY =
        state.textPosition === "top"
          ? 60
          : state.textPosition === "bottom"
            ? canvas.height - 40
            : canvas.height / 2;

      ctx.font = `bold ${state.textSize}px Arial`;
      ctx.fillStyle = state.textColor;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(state.textOverlay, canvas.width / 2, textY);
    }
  };

  // Handle editor state changes
  const handleStateChange = (newState: Partial<EditorState>) => {
    const updated = { ...editorState, ...newState };
    setEditorState(updated);
    if (originalImage) {
      redrawCanvas(originalImage, updated);
    }
  };

  // Download edited image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `thumbnail-${Date.now()}.png`;
    link.click();
  };

  // Export as different formats
  const handleExport = (format: "png" | "jpg" | "webp") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mimeType = {
      png: "image/png",
      jpg: "image/jpeg",
      webp: "image/webp",
    }[format];

    const link = document.createElement("a");
    link.href = canvas.toDataURL(mimeType);
    link.download = `thumbnail-${Date.now()}.${format}`;
    link.click();
  };

  // Reset to original
  const handleReset = () => {
    setEditorState({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      textOverlay: "",
      textColor: "#FFFFFF",
      textSize: 48,
      textPosition: "center",
      backgroundColor: "transparent",
      borderRadius: 0,
      scale: 100,
    });
    if (originalImage) {
      redrawCanvas(originalImage, editorState);
    }
  };

  if (!thumbnail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading thumbnail...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Thumbnail Editor</h1>
            <p className="text-muted-foreground">Edit and customize your generated thumbnail</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Main Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Preview */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="bg-muted rounded-lg overflow-auto flex items-center justify-center" style={{ height: "500px" }}>
                <canvas ref={canvasRef} className="max-w-full max-h-full" />
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  Download PNG
                </Button>
                <Button variant="outline" onClick={() => handleExport("jpg")} className="flex-1">
                  Export JPG
                </Button>
                <Button variant="outline" onClick={() => handleExport("webp")} className="flex-1">
                  Export WebP
                </Button>
              </div>
            </Card>
          </div>

          {/* Editor Controls */}
          <div>
            <Card className="p-4">
              <Tabs defaultValue="filters" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="filters">Filters</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                </TabsList>

                {/* Filters Tab */}
                <TabsContent value="filters" className="space-y-4">
                  <div>
                    <Label>Brightness</Label>
                    <Slider
                      value={[editorState.brightness]}
                      onValueChange={(value) => handleStateChange({ brightness: value[0] })}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.brightness}%</span>
                  </div>

                  <div>
                    <Label>Contrast</Label>
                    <Slider
                      value={[editorState.contrast]}
                      onValueChange={(value) => handleStateChange({ contrast: value[0] })}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.contrast}%</span>
                  </div>

                  <div>
                    <Label>Saturation</Label>
                    <Slider
                      value={[editorState.saturation]}
                      onValueChange={(value) => handleStateChange({ saturation: value[0] })}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.saturation}%</span>
                  </div>

                  <div>
                    <Label>Hue Rotation</Label>
                    <Slider
                      value={[editorState.hue]}
                      onValueChange={(value) => handleStateChange({ hue: value[0] })}
                      min={0}
                      max={360}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.hue}°</span>
                  </div>

                  <div>
                    <Label>Blur</Label>
                    <Slider
                      value={[editorState.blur]}
                      onValueChange={(value) => handleStateChange({ blur: value[0] })}
                      min={0}
                      max={20}
                      step={0.5}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.blur}px</span>
                  </div>
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label>Text Overlay</Label>
                    <Input
                      value={editorState.textOverlay}
                      onChange={(e) => handleStateChange({ textOverlay: e.target.value })}
                      placeholder="Enter text..."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={editorState.textColor}
                      onChange={(e) => handleStateChange({ textColor: e.target.value })}
                      className="mt-2 h-10"
                    />
                  </div>

                  <div>
                    <Label>Text Size</Label>
                    <Slider
                      value={[editorState.textSize]}
                      onValueChange={(value) => handleStateChange({ textSize: value[0] })}
                      min={12}
                      max={120}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.textSize}px</span>
                  </div>

                  <div>
                    <Label>Text Position</Label>
                    <Select value={editorState.textPosition} onValueChange={(value: any) => handleStateChange({ textPosition: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="space-y-4">
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={editorState.backgroundColor}
                      onChange={(e) => handleStateChange({ backgroundColor: e.target.value })}
                      className="mt-2 h-10"
                    />
                  </div>

                  <div>
                    <Label>Border Radius</Label>
                    <Slider
                      value={[editorState.borderRadius]}
                      onValueChange={(value) => handleStateChange({ borderRadius: value[0] })}
                      min={0}
                      max={50}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.borderRadius}px</span>
                  </div>

                  <div>
                    <Label>Scale</Label>
                    <Slider
                      value={[editorState.scale]}
                      onValueChange={(value) => handleStateChange({ scale: value[0] })}
                      min={50}
                      max={150}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{editorState.scale}%</span>
                  </div>
                </TabsContent>
              </Tabs>

              <Button variant="outline" onClick={handleReset} className="w-full mt-4">
                Reset to Original
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

