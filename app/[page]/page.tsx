"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NestedSection } from "@/components/NestedSection";
import { ParagraphSection } from "@/components/ParagraphSection";
import { SimpleMode } from "@/components/SimpleMode";
import { AdvancedLearningSystem } from "@/components/AdvancedLearningSystem";
import { LearningPlatform } from "@/components/learning-platform/LearningPlatform";
import { TextbookSection } from "@/components/TextbookSection";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { BookmarksSidebar } from "@/components/BookmarksSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContentSkeleton, SidebarSkeleton } from "@/components/ContentSkeleton";
import { useTranslation } from "@/lib/i18n";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";

export type ViewMode = "book" | "study" | "simple" | "advanced";

interface Question {
  id: string;
  number: string;
  text: string;
}

interface FlashcardSection {
  id: string;
  timestamp: string;
  title: string;
  questions: Question[];
}

interface ButtonConfig {
  url: string;
  text: string;
  icon: string;
  iconType?: "name" | "url";
  variant?: "primary" | "secondary";
}

interface ContentData {
  siteMetadata: {
    title: string;
    description: string;
  };
  showTimestamps?: boolean;
  sections: FlashcardSection[];
  buttons?: ButtonConfig[];
  showExportButtons?: boolean;
  showAnkiExport?: boolean;
  showFlashcardsExport?: boolean;
  showTranscriptExport?: boolean;
  showCopyTranscript?: boolean;
  defaultViewMode?: ViewMode;
  availableModes?: ViewMode[];
}

const SUPPORTED_MODES: ViewMode[] = ["book", "study", "simple", "advanced"];
// How many sections to reveal per progressive step
const CHUNK_SIZE = 3;

function normalizeAvailableModes(modes: any): ViewMode[] {
  if (!Array.isArray(modes) || modes.length === 0) return SUPPORTED_MODES;
  return modes.filter((mode): mode is ViewMode => SUPPORTED_MODES.includes(mode));
}

function applyLoadedData(
  loadedData: any,
  queryMode: ViewMode | null,
  setData: (d: any) => void,
  setIsParagraphContent: (v: boolean) => void,
  setIsTextbookContent: (v: boolean) => void,
  setAvailableModes: (m: ViewMode[]) => void,
  setViewMode: (m: ViewMode) => void,
  setVisibleSections: (n: number) => void,
  setIsLoading: (v: boolean) => void,
  initialChunk: number
) {
  setData(loadedData);

  const hasParagraphs = loadedData.sections?.some(
    (s: any) => s.paragraphs && s.paragraphs.length > 0
  );
  setIsParagraphContent(hasParagraphs);

  const hasTextbookBlocks =
    loadedData.contentFormat === "textbook" ||
    loadedData.sections?.some((s: any) => s.blocks && s.blocks.length > 0);
  setIsTextbookContent(hasTextbookBlocks);

  const pageAvailableModes = normalizeAvailableModes(loadedData.availableModes);
  setAvailableModes(pageAvailableModes);

  const chosenMode =
    queryMode && pageAvailableModes.includes(queryMode)
      ? queryMode
      : loadedData.defaultViewMode && pageAvailableModes.includes(loadedData.defaultViewMode)
      ? loadedData.defaultViewMode
      : pageAvailableModes[0] || "book";

  setViewMode(chosenMode);
  setVisibleSections(initialChunk);
  setIsLoading(false);
}

export default function Page({ params }: { params: { page: string } }) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("book");
  const [availableModes, setAvailableModes] = useState<ViewMode[]>(SUPPORTED_MODES);
  const [isParagraphContent, setIsParagraphContent] = useState<boolean>(false);
  const [isTextbookContent, setIsTextbookContent] = useState<boolean>(false);
  const [visibleSections, setVisibleSections] = useState<number>(CHUNK_SIZE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const progressiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { t } = useTranslation();
  const { bookmarks, bookmarkList, toggleBookmark, clearBookmarks } = useBookmarks(params.page);

  const totalSections = useMemo(() => data?.sections?.length || 0, [data]);

  // ── Load view mode from localStorage / query param ──────────────────────────
  useEffect(() => {
    const savedMode = localStorage.getItem(`viewMode-${params.page}`) as ViewMode;
    const queryMode = searchParams.get("mode") as ViewMode | null;
    if (queryMode && SUPPORTED_MODES.includes(queryMode)) {
      setViewMode(queryMode);
    } else if (savedMode && SUPPORTED_MODES.includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, [params.page, searchParams]);

  const handleModeChange = useCallback(
    (mode: ViewMode) => {
      if (!availableModes.includes(mode)) return;
      setViewMode(mode);
      localStorage.setItem(`viewMode-${params.page}`, mode);
    },
    [availableModes, params.page]
  );

  // ── Main data loader ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const cacheKey = `content-${params.page}`;
      const queryMode = searchParams.get("mode") as ViewMode | null;

      // 1. Try localStorage cache → instant first paint
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (!cancelled) {
            applyLoadedData(
              cached,
              queryMode,
              setData,
              setIsParagraphContent,
              setIsTextbookContent,
              setAvailableModes,
              setViewMode,
              setVisibleSections,
              setIsLoading,
              CHUNK_SIZE
            );
          }
          // Still fetch fresh in background to keep cache up-to-date
          fetch(`/api/content/${params.page}`)
            .then((r) => r.ok ? r.json() : null)
            .then((fresh) => {
              if (fresh && !cancelled) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(fresh));
                } catch {}
              }
            })
            .catch(() => {});
          return;
        }
      } catch {}

      // 2. No cache → fetch from API route
      try {
        const res = await fetch(`/api/content/${params.page}`);
        if (!res.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const loadedData = await res.json();
        if (cancelled) return;

        // Persist to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify(loadedData));
        } catch {}

        applyLoadedData(
          loadedData,
          queryMode,
          setData,
          setIsParagraphContent,
          setIsTextbookContent,
          setAvailableModes,
          setViewMode,
          setVisibleSections,
          setIsLoading,
          CHUNK_SIZE
        );
      } catch (err) {
        console.error("Error loading data:", err);
        if (!cancelled) {
          setLoadError(true);
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [params.page, searchParams]);

  // ── Progressive rendering: reveal CHUNK_SIZE sections at a time ──────────────
  // Fires once whenever `data` arrives or `visibleSections` changes,
  // but only schedules the NEXT step — no cascading re-fires.
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    // Clear any pending timer from a previous render
    if (progressiveTimerRef.current) clearTimeout(progressiveTimerRef.current);

    progressiveTimerRef.current = setTimeout(() => {
      setVisibleSections((prev) => Math.min(prev + CHUNK_SIZE, totalSections));
    }, 50); // 50 ms between chunks — fast but yields to the browser

    return () => {
      if (progressiveTimerRef.current) clearTimeout(progressiveTimerRef.current);
    };
  }, [data?.sections, visibleSections, totalSections]);

  // ── Scroll-based early loading ───────────────────────────────────────────────
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollPosition >= documentHeight - 800) {
        setVisibleSections((prev) => Math.min(prev + CHUNK_SIZE, totalSections));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data?.sections, visibleSections, totalSections]);

  // ── Scroll spy ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.sections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      let activeId = "";

      const allElements: { id: string; offsetTop: number; endTop: number }[] = [];

      for (const section of data.sections) {
        const element = document.getElementById(section.id);
        if (element) {
          allElements.push({
            id: section.id,
            offsetTop: element.offsetTop,
            endTop: element.offsetTop + element.offsetHeight,
          });
        }

        section.blocks?.forEach((block: any) => {
          if (block.type === "text" && block.content) {
            const h3Matches = block.content.match(/\{#([a-z0-9-]+)\}/g);
            if (h3Matches) {
              h3Matches.forEach((match: string) => {
                const idMatch = match.match(/\{#([a-z0-9-]+)\}/);
                if (idMatch) {
                  const subElement = document.getElementById(idMatch[1]);
                  if (subElement) {
                    const allHeadings = Array.from(document.querySelectorAll("h2[id], h3[id]"));
                    const currentIndex = allHeadings.findIndex((h) => h.id === idMatch[1]);
                    const nextHeading = currentIndex >= 0 ? allHeadings[currentIndex + 1] : null;
                    const endTop = nextHeading
                      ? (nextHeading as HTMLElement).offsetTop
                      : subElement.offsetTop + subElement.offsetHeight;
                    allElements.push({
                      id: idMatch[1],
                      offsetTop: subElement.offsetTop,
                      endTop,
                    });
                  }
                }
              });
            }
          }
        });
      }

      allElements.sort((a, b) => a.offsetTop - b.offsetTop);

      for (const elem of allElements) {
        if (scrollPosition >= elem.offsetTop && scrollPosition < elem.endTop) {
          activeId = elem.id;
          break;
        } else if (scrollPosition < elem.offsetTop) {
          break;
        } else {
          activeId = elem.id;
        }
      }

      setActiveSection(activeId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data?.sections]);

  const showSkeleton = isLoading || !data;

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Outer wrapper is in normal flow — scrolls away with the page.
          Controls are absolute inside it so they sit exactly at top-right. */}
      <div className="relative w-full">
        {/* Controls: top-right corner, small margin from top edge */}
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <ThemeToggle />
          {!showSkeleton && (isParagraphContent || isTextbookContent) && (
            <ModeSwitcher
              currentMode={viewMode}
              availableModes={availableModes}
              onModeChange={handleModeChange}
            />
          )}
        </div>

        {/* Header — pushed down below the controls row */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-14 pb-2" style={{ paddingRight: "max(1rem, 280px)" }}>
          {showSkeleton ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-8 bg-secondary rounded w-1/3"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
          ) : (
            <Header
              siteMetadata={data.siteMetadata}
              sections={data.sections}
              buttons={data.buttons}
              showExportButtons={data.showExportButtons}
              showAnkiExport={data.showAnkiExport}
              showFlashcardsExport={data.showFlashcardsExport}
              showTranscriptExport={data.showTranscriptExport}
              showCopyTranscript={data.showCopyTranscript}
              showLanguageSwitcher={false}
            />
          )}
        </div>
      </div>

      <div className="w-full border-t border-border"></div>

      <main className="min-h-screen bg-background">
        <div className="flex flex-col md:flex-row md:gap-8 mt-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sidebar — independently scrollable, does not propagate wheel to page */}
          <aside className="xl:w-[280px] lg:w-[250px] md:w-[220px] md:block flex-shrink-0">
            <div
              className="sticky top-5 flex flex-col"
              style={{ height: "calc(100vh - 2.5rem)" }}
              onWheel={(e) => {
                // Prevent the page from scrolling when the wheel is over the sidebar
                e.stopPropagation();
              }}
            >
              <div className="p-5 pb-3 flex-shrink-0">
                <h2 className="text-sm font-medium text-foreground mb-3">{t("table_of_contents", "Inhoudsopgave")}</h2>
              </div>

              {/* Scrollable nav — takes all remaining height, scrollbar hidden */}
              <nav
                className="flex-1 overflow-y-auto overscroll-contain min-h-0"
              >
                <div className="space-y-1 px-2 pb-4">
                  {showSkeleton && <SidebarSkeleton />}
                  {!showSkeleton && data.sections && data.sections.length > 0 && (
                    <>
                      <div
                        className="w-full text-left px-3 py-2 rounded-md text-[13px] font-medium text-foreground select-none cursor-default"
                      >
                        <span className="inline">
                          {data.siteMetadata?.title || data.sections[0].title}
                        </span>
                      </div>

                      <div className="ml-2 space-y-0.5 pl-3">
                        {data.sections.map((section: any) => (
                          <button
                            key={section.id}
                            onClick={() => {
                              document
                                .getElementById(section.id)
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded text-[12px] transition-colors hover:bg-secondary/50 ${
                              activeSection === section.id
                                ? "bg-secondary/50 text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="inline">{section.title}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </nav>

              {isParagraphContent && viewMode === "book" && (
                <div className="flex-shrink-0">
                  <BookmarksSidebar
                    bookmarks={bookmarkList}
                    onRemove={(paragraphId) => toggleBookmark(paragraphId, "")}
                    onClear={clearBookmarks}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 px-5 py-10 min-w-0">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
              {showSkeleton ? (
                <ContentSkeleton />
              ) : isTextbookContent ? (
                <>
                  {data.sections.slice(0, visibleSections).map((section: any, index: number) => {
                    if (viewMode === "advanced") {
                      return index === 0 ? (
                        <AdvancedLearningSystem
                          key="advanced-learning-system"
                          sourceSections={data.sections.map((s: any) => ({
                            id: s.id,
                            title: s.title,
                            paragraphs: (s.blocks ?? [])
                              .filter((b: any) => b.type === "questions")
                              .flatMap((b: any) =>
                                (b.questions ?? []).map((q: any) => ({
                                  id: q.id,
                                  title: q.number,
                                  content: q.text,
                                  questions: [
                                    {
                                      id: q.id,
                                      number: q.number,
                                      question: q.text,
                                      answer:
                                        s.answers?.find((a: any) => a.questionId === q.id)
                                          ?.answer ?? "",
                                      type: "inline",
                                    },
                                  ],
                                }))
                              ),
                          }))}
                        />
                      ) : null;
                    }
                    if (viewMode === "study") {
                      const pageHasQuestions = data.sections.some((s: any) =>
                        s.blocks?.some(
                          (b: any) => b.type === "questions" && b.questions?.length > 0
                        )
                      );
                      if (!pageHasQuestions) return null;
                      return index === 0 ? (
                        <LearningPlatform
                          key="study-learning-platform"
                          pageId={params.page}
                          sections={data.sections}
                        />
                      ) : null;
                    }
                    return (
                      <TextbookSection
                        key={section.id}
                        section={section}
                        viewMode={viewMode}
                        bookmarks={bookmarks}
                        onToggleBookmark={toggleBookmark}
                      />
                    );
                  })}
                </>
              ) : isParagraphContent ? (
                data.sections.slice(0, visibleSections).map((section: any, index: number) => {
                  if (viewMode === "book") {
                    return (
                      <ParagraphSection
                        key={section.id}
                        section={section}
                        showTimestamps={data.showTimestamps}
                        bookmarks={bookmarks}
                        onToggleBookmark={toggleBookmark}
                      />
                    );
                  } else if (viewMode === "study") {
                    const pageHasQuestions = data.sections.some((s: any) =>
                      s.paragraphs?.some((p: any) => p.questions?.length > 0)
                    );
                    if (!pageHasQuestions) return null;
                    return index === 0 ? (
                      <LearningPlatform
                        key="study-learning-platform"
                        pageId={params.page}
                        sections={data.sections}
                      />
                    ) : null;
                  } else if (viewMode === "simple") {
                    return <SimpleMode key={section.id} section={section} />;
                  } else {
                    return index === 0 ? (
                      <AdvancedLearningSystem
                        key="advanced-learning-system"
                        sourceSections={data.sections}
                      />
                    ) : null;
                  }
                })
              ) : (
                data.sections.slice(0, visibleSections).map((section: any) => (
                  <NestedSection
                    key={section.id}
                    section={section}
                    showTimestamps={data.showTimestamps}
                  />
                ))
              )}

              {/* Subtle progress indicator while more chunks are loading */}
              {!showSkeleton && visibleSections < totalSections && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </div>
            <Footer />
          </div>
        </div>
      </main>
    </>
  );
}
