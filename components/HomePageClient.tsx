"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthModal } from "@/components/AuthModal";

interface ContentFile {
  pageName: string;
  title: string;
  description: string;
}

function TitleWithFlatDash({ title }: { title: string }) {
  const parts = title.split(" - ");

  if (parts.length === 1) return <>{title}</>;

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 && (
            <span className="mx-1 inline-block translate-y-[-0.02em] font-sans not-italic leading-none">
              -
            </span>
          )}
          {part}
        </span>
      ))}
    </>
  );
}

export function HomePageClient({ contentFiles }: { contentFiles: ContentFile[] }) {
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const planningPage = contentFiles.find((content) => content.pageName === "toetsweekplanning");
  const subjectPages = contentFiles.filter((content) => content.pageName !== "toetsweekplanning");

  useEffect(() => {
    setMounted(true);
    // Check if user has already logged in
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      // Show auth modal on first visit if no user data
      // DISABLED: Auth modal will never be shown
      // setShowAuthModal(true);
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
            {mounted ? t("home_title", "Toetsweekvoorbereiding") : "Toetsweekvoorbereiding"}
          </h1>
          <p className="text-muted-foreground text-center text-lg max-w-2xl mx-auto">
            {mounted
              ? t("home_subtitle", "Kies hieronder een vak om te oefenen voor de toetsweek.")
              : "Kies hieronder een vak om te oefenen voor de toetsweek."}
          </p>
        </header>

        {planningPage && (
          <div className="mb-8">
            <Link
              href={`/${planningPage.pageName}`}
              className="flex flex-col gap-4 rounded-lg border border-border bg-gradient-to-br from-card to-secondary/40 p-6 shadow-sm transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm">
                <CalendarDays className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Planning
                </span>
                <span className="mt-1 block text-2xl font-serif font-semibold text-foreground">
                  {planningPage.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  Bekijk wanneer je toetsen zijn en welke stof daarbij hoort.
                </span>
              </span>
              <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
            </Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjectPages.map((content) => (
            <Link
              key={content.pageName}
              href={`/${content.pageName}`}
              className="block p-6 border border-border rounded-lg transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground mb-2 font-serif">
                  <TitleWithFlatDash title={content.title} />
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
