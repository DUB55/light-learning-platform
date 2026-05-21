"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthModal } from "@/components/AuthModal";

interface ContentFile {
  pageName: string;
  title: string;
  description: string;
}

export function HomePageClient({ contentFiles }: { contentFiles: ContentFile[] }) {
  const { t } = useTranslation();
  const firstPage = contentFiles[0]?.pageName || "math";
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check if user has already logged in
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      // Show auth modal on first visit if no user data
      setShowAuthModal(true);
    }
  }, []);

  const handleAuthComplete = (userData: any) => {
    // User completed auth (either logged in or skipped)
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onComplete={handleAuthComplete}
      />
      <div className="max-w-4xl mx-auto px-5 py-10 md:py-14">
        <header className="mb-12">
          <h1 className="text-4xl font-serif text-foreground font-medium text-center mb-4">
            {t("home_title", "Study Guide Platform")}
          </h1>
          <p className="text-muted-foreground text-center text-lg max-w-2xl mx-auto">
            {t("home_subtitle", "Choose a study guide below to get started:")}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/${firstPage}?mode=advanced`}
            className="block p-6 border border-border rounded-lg bg-card transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-foreground mb-2 font-serif">
                {t("advanced_title", "Study dashboard")}
              </h2>
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("advanced_home_description", "Practice with advanced study modes and local progress tracking.")}
            </p>
          </Link>

          {contentFiles.map((content) => (
            <Link
              key={content.pageName}
              href={`/${content.pageName}`}
              className="block p-6 border border-border rounded-lg transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground mb-2 font-serif">
                  {content.title}
                </h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {content.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
