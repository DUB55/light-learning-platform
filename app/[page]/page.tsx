"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NestedSection } from "@/components/NestedSection";
import { ParagraphSection } from "@/components/ParagraphSection";
import { SimpleMode } from "@/components/SimpleMode";
import { StudyMode } from "@/components/StudyMode";
import { AdvancedLearningSystem } from "@/components/AdvancedLearningSystem";
import { TextbookSection } from "@/components/TextbookSection";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { BookmarksSidebar } from "@/components/BookmarksSidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContentSkeleton, SidebarSkeleton } from "@/components/ContentSkeleton";
import { useTranslation } from "@/lib/i18n";
import { useBookmarks } from "@/hooks/useBookmarks";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, memo, useMemo } from "react";

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

function normalizeAvailableModes(modes: any): ViewMode[] {
  if (!Array.isArray(modes) || modes.length === 0) return SUPPORTED_MODES;
  return modes.filter((mode): mode is ViewMode => SUPPORTED_MODES.includes(mode));
}

async function getPageData(pageName: string): Promise<ContentData | null> {
  try {
    const content = await import(`@/content/${pageName}.json`);
    return content.default as ContentData;
  } catch (error) {
    return null;
  }
}


export default function Page({ params }: { params: { page: string } }) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("book");
  const [availableModes, setAvailableModes] = useState<ViewMode[]>(SUPPORTED_MODES);
  const [isParagraphContent, setIsParagraphContent] = useState<boolean>(false);
  const [isTextbookContent, setIsTextbookContent] = useState<boolean>(false);
  const [visibleSections, setVisibleSections] = useState<number>(1); // Chunked rendering
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  
  // Translation hook
  const { t, translationsReady } = useTranslation();
  
  // Bookmarks hook
  const { bookmarks, bookmarkList, toggleBookmark, clearBookmarks } = useBookmarks(params.page);

  // Total sections count
  const totalSections = useMemo(() => data?.sections?.length || 0, [data]);

  // Load view mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem(`viewMode-${params.page}`) as ViewMode;
    const queryMode = searchParams.get("mode") as ViewMode | null;
    if (queryMode && ["book", "study", "simple", "advanced"].includes(queryMode)) {
      setViewMode(queryMode);
    } else if (savedMode && ["book", "study", "simple", "advanced"].includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, [params.page, searchParams]);

  // Save view mode to localStorage
  const handleModeChange = (mode: ViewMode) => {
    if (!availableModes.includes(mode)) {
      return;
    }
    setViewMode(mode);
    localStorage.setItem(`viewMode-${params.page}`, mode);
  };

  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `content-${params.page}`;
      const queryMode = searchParams.get("mode") as ViewMode | null;
      
      // Try to load from cache first for instant display
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          setData(parsedCache);
          
          const pageAvailableModes = normalizeAvailableModes(parsedCache.availableModes);
          setAvailableModes(pageAvailableModes);

          const hasParagraphs = parsedCache.sections?.some((s: any) => s.paragraphs && s.paragraphs.length > 0);
          setIsParagraphContent(hasParagraphs);
          
          const hasTextbookBlocks = parsedCache.contentFormat === "textbook" ||
            parsedCache.sections?.some((s: any) => s.blocks && s.blocks.length > 0);
          setIsTextbookContent(hasTextbookBlocks);
          
          const chosenMode = queryMode && pageAvailableModes.includes(queryMode)
            ? queryMode
            : parsedCache.defaultViewMode && pageAvailableModes.includes(parsedCache.defaultViewMode)
            ? parsedCache.defaultViewMode
            : pageAvailableModes[0] || "book";

          setViewMode(chosenMode);
          
          // Show first section immediately from cache
          setVisibleSections(1);
          setIsLoading(false);
          return; // Exit early if cache hit
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
      }
      
      // No cache, load fresh data immediately
      try {
        const content = await import(`@/content/${params.page}.json`);
        const loadedData = content.default;
        setData(loadedData);
        
        // Save to cache for next time
        try {
          localStorage.setItem(cacheKey, JSON.stringify(loadedData));
        } catch (saveError) {
          console.error('Error saving to cache:', saveError);
        }
        
        // Check if content has paragraphs (new structure) or legacy structure
        const hasParagraphs = loadedData.sections?.some((s: any) => s.paragraphs && s.paragraphs.length > 0);
        setIsParagraphContent(hasParagraphs);
        
        // Check if content uses the new textbook format (blocks + answers)
        const hasTextbookBlocks = loadedData.contentFormat === "textbook" ||
          loadedData.sections?.some((s: any) => s.blocks && s.blocks.length > 0);
        setIsTextbookContent(hasTextbookBlocks);

        const pageAvailableModes = normalizeAvailableModes(loadedData.availableModes);
        setAvailableModes(pageAvailableModes);

        const chosenMode = queryMode && pageAvailableModes.includes(queryMode)
          ? queryMode
          : loadedData.defaultViewMode && pageAvailableModes.includes(loadedData.defaultViewMode)
          ? loadedData.defaultViewMode
          : pageAvailableModes[0] || "book";

        setViewMode(chosenMode);
        
        // Start with more sections visible for faster initial render
        setVisibleSections(Math.min(3, loadedData.sections?.length || 1));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params.page, searchParams]);

  // Progressive loading - load more sections as user scrolls
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more sections when user scrolls near bottom (500px threshold for earlier loading)
      if (scrollPosition >= documentHeight - 500) {
        setVisibleSections((prev) => Math.min(prev + 3, totalSections));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.sections, visibleSections, totalSections]);

  // Auto-load more sections after initial render for faster perceived performance
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    const timer = setTimeout(() => {
      setVisibleSections((prev) => Math.min(prev + 2, totalSections));
    }, 200); // Load more sections faster after 200ms

    return () => clearTimeout(timer);
  }, [data?.sections, visibleSections, totalSections]);

  // Additional aggressive loading for first-time visitors
  useEffect(() => {
    if (!data?.sections || visibleSections >= totalSections) return;

    const timer = setTimeout(() => {
      setVisibleSections((prev) => Math.min(prev + 3, totalSections));
    }, 500); // Load even more sections after 500ms

    return () => clearTimeout(timer);
  }, [data?.sections, visibleSections, totalSections]);

  // Scroll spy effect to highlight active section (including sub-sections)
  useEffect(() => {
    if (!data?.sections) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header
      let activeId = '';

      // Collect all potential elements (sections and subheadings) with their positions
      const allElements: { id: string; offsetTop: number; endTop: number }[] = [];

      for (const section of data.sections) {
        // Add main section
        const element = document.getElementById(section.id);
        if (element) {
          allElements.push({
            id: section.id,
            offsetTop: element.offsetTop,
            endTop: element.offsetTop + element.offsetHeight
          });
        }

        // Extract and add subheading IDs from markdown content
        section.blocks?.forEach((block: any) => {
          if (block.type === "text" && block.content) {
            const h3Matches = block.content.match(/\{#([a-z0-9-]+)\}/g);
            if (h3Matches) {
              h3Matches.forEach((match: string) => {
                const idMatch = match.match(/\{#([a-z0-9-]+)\}/);
                if (idMatch) {
                  const subElement = document.getElementById(idMatch[1]);
                  if (subElement) {
                    // Find the next heading (h2 or h3) to determine the end of this section
                    const allHeadings = Array.from(document.querySelectorAll('h2[id], h3[id]'));
                    const currentIndex = allHeadings.findIndex(h => h.id === idMatch[1]);
                    const nextHeading = currentIndex >= 0 ? allHeadings[currentIndex + 1] : null;
                    
                    const endTop = nextHeading 
                      ? (nextHeading as HTMLElement).offsetTop 
                      : subElement.offsetTop + subElement.offsetHeight;
                    
                    allElements.push({
                      id: idMatch[1],
                      offsetTop: subElement.offsetTop,
                      endTop: endTop
                    });
                  }
                }
              });
            }
          }
        });
      }

      // Sort by offsetTop
      allElements.sort((a, b) => a.offsetTop - b.offsetTop);

      // Find the element that the user is currently viewing
      for (const elem of allElements) {
        if (scrollPosition >= elem.offsetTop && scrollPosition < elem.endTop) {
          activeId = elem.id;
          break;
        } else if (scrollPosition < elem.offsetTop) {
          // We've passed the scroll position, use the previous element
          break;
        } else {
          // We're past this element, keep track as fallback
          activeId = elem.id;
        }
      }

      setActiveSection(activeId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.sections]);

  
  
  // Show layout immediately with skeleton states while loading
  const showSkeleton = isLoading || !data;
  
  return (
    <>
      <div className="w-full p-5 py-10">
        <div className="xl:ml-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with toggles positioned at top right */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                {showSkeleton ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-secondary rounded w-1/3"></div>
                    <div className="h-4 bg-secondary rounded w-2/3"></div>
                  </div>
                ) : (
                  <Header siteMetadata={data.siteMetadata} sections={data.sections} buttons={data.buttons} showExportButtons={data.showExportButtons} showAnkiExport={data.showAnkiExport} showFlashcardsExport={data.showFlashcardsExport} showTranscriptExport={data.showTranscriptExport} showCopyTranscript={data.showCopyTranscript} showLanguageSwitcher={false} />
                )}
              </div>
              {/* Toggle buttons positioned at top right */}
              {!showSkeleton && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ThemeToggle />
                  {(isParagraphContent || isTextbookContent) && (
                    <ModeSwitcher currentMode={viewMode} availableModes={availableModes} onModeChange={handleModeChange} />
                  )}
                </div>
              )}
            </div>
          </div>
      
      {/* Vertical separator line */}
      <div className="w-full border-t border-border"></div>
      
      {/* Content area with sidebar and main content */}
      <main className="min-h-screen bg-background">
        <div className="flex flex-col md:flex-row md:gap-8 mt-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sections sidebar - recoded for proper scrolling */}
          <aside className="xl:w-[280px] lg:w-[250px] md:w-[220px] md:block flex-shrink-0">
            <div className="sticky top-5">
              <div className="p-5 pb-3">
                <h2 className="text-sm font-medium text-foreground mb-3">{t('sections')}</h2>
              </div>
              <nav className="overflow-y-auto">
                {/* Hierarchical section navigation */}
                <div className="space-y-1 px-2">
                  {showSkeleton && <SidebarSkeleton />}
                  {!showSkeleton && data.sections && data.sections.length > 0 && (
                    <>
                      {/* Main Chapter Section */}
                      <button
                        onClick={() => {
                          const element = document.getElementById(data.sections[0].id);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors hover:bg-secondary ${
                          activeSection === data.sections[0].id
                            ? "bg-secondary text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        <span className="inline">{data.siteMetadata?.title || data.sections[0].title}</span>
                      </button>

                      {/* All sections as subheadings */}
                      <div className="ml-2 space-y-0.5 pl-3">
                        {data.sections.map((section: any) => (
                          <button
                            key={section.id}
                            onClick={() => {
                              const element = document.getElementById(section.id);
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
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
              
              {/* Bookmarks Section */}
              {isParagraphContent && viewMode === "book" && (
                <BookmarksSidebar
                  bookmarks={bookmarkList}
                  onRemove={(paragraphId) => toggleBookmark(paragraphId, "")}
                  onClear={clearBookmarks}
                />
              )}
            </div>
          </aside>
          
          {/* Main content */}
          <div className="flex-1 px-5 py-10 min-w-0">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
              {showSkeleton ? (
                <ContentSkeleton />
              ) : isTextbookContent ? (
                // Textbook format: blocks (text + questions) + answers at bottom
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
                                        s.answers?.find((a: any) => a.questionId === q.id)?.answer ?? "",
                                      type: "inline",
                                    },
                                  ],
                                }))
                              ),
                          }))}
                        />
                      ) : null;
                    }
                    // In study mode, only show sections that have questions
                    if (viewMode === "study") {
                      const hasQuestions = section.blocks?.some((b: any) => b.type === "questions" && b.questions?.length > 0);
                      if (!hasQuestions) return null;
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
                // Paragraph-based content with mode switching - chunked rendering
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
                    // Only show sections that have questions in study mode
                    const hasQuestions = section.paragraphs?.some((p: any) => p.questions?.length > 0);
                    if (hasQuestions) {
                      return (
                        <StudyMode
                          key={section.id}
                          section={section}
                        />
                      );
                    }
                    return null;
                  } else if (viewMode === "simple") {
                    return (
                      <SimpleMode
                        key={section.id}
                        section={section}
                      />
                    );
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
                // Legacy content with nested sections - chunked rendering
                data.sections.slice(0, visibleSections).map((section: any) => (
                  <NestedSection
                    key={section.id}
                    section={section}
                    showTimestamps={data.showTimestamps}
                  />
                ))
              )}
              
              {/* Loading indicator for more content */}
              {visibleSections < totalSections && (
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
