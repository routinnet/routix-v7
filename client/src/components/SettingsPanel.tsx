import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Bell,
  Lock,
  Palette,
  Volume2,
  Eye,
  Save,
  X,
} from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
}

interface UserSettings {
  notifications: boolean;
  soundEnabled: boolean;
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  autoSave: boolean;
  showPreview: boolean;
}

export function SettingsPanel({
  isOpen,
  onClose,
  onSave,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    soundEnabled: true,
    theme: "auto",
    fontSize: "medium",
    autoSave: true,
    showPreview: true,
  });

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-lg font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <label className="font-medium">Notifications</label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">
                Enable notifications for new generations
              </span>
            </label>
          </div>

          {/* Sound */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-primary" />
              <label className="font-medium">Sound</label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    soundEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">
                Play sound on completion
              </span>
            </label>
          </div>

          {/* Theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <label className="font-medium">Theme</label>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  theme: e.target.value as "light" | "dark" | "auto",
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary" />
              <label className="font-medium">Font Size</label>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  fontSize: e.target.value as "small" | "medium" | "large",
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Auto Save */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-primary" />
              <label className="font-medium">Auto Save</label>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoSave: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">
                Automatically save conversations
              </span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPreview}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    showPreview: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">
                Show thumbnail preview
              </span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}

