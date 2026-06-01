"use client";

import { useEffect, useState } from "react";
import { FileText, GraduationCap, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAnalytics } from "@/lib/analytics";

type ViewMode = "book" | "study" | "simple" | "samenvatting";

interface ModeSwitcherProps {
  currentMode: ViewMode;
  availableModes?: ViewMode[];
  onModeChange: (mode: ViewMode) => void;
}

export function ModeSwitcher({ currentMode, availableModes, onModeChange }: ModeSwitcherProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleModeChange = (mode: ViewMode) => {
    track('mode_switch', { from: currentMode, to: mode });
    onModeChange(mode);
  };

  if (!mounted) {
    return <div className="h-10 w-48 bg-secondary/50 rounded-md animate-pulse" />;
  }

  const modes: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "simple",
      label: t('simple_mode', 'Uitleg'),
      icon: <FileText className="w-4 h-4" />,
      description: t('simple_mode_description', 'Volledige tekstweergave'),
    },
    {
      id: "study",
      label: t('study_mode', 'Leren'),
      icon: <GraduationCap className="w-4 h-4" />,
      description: t('study_mode_description', 'Leren, oefentoets en spelletjes'),
    },
    {
      id: "samenvatting",
      label: t('summary_mode', 'Samenvatting'),
      icon: <BookOpen className="w-4 h-4" />,
      description: t('summary_mode_description', 'Samenvatting van de stof'),
    },
  ];

  const visibleModes = availableModes && availableModes.length > 0
    ? modes.filter((mode) => availableModes.includes(mode.id))
    : modes;

  if (visibleModes.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border">
      {visibleModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeChange(mode.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            currentMode === mode.id
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title={mode.description}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
