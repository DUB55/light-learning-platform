"use client";

import { Star } from "lucide-react";
import type { Term } from "@/types/learning-platform";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { MarkdownContent } from "./shared/MarkdownContent";

function StatusIcon({ status }: { status: Term["masteryStatus"] }) {
  const colors = {
    unstudied: "bg-muted-foreground/30",
    learning: "bg-yellow-500",
    mastered: "bg-green-600",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colors[status]}`}
      title={status}
    />
  );
}

export function TermList({ terms }: { terms: Term[] }) {
  const toggleStar = useLearningPlatformStore((s) => s.toggleStar);

  return (
    <ul className="space-y-3">
      {terms.map((term) => (
        <li
          key={term.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 hover:bg-secondary/30"
        >
          <span className="pt-1">
            <StatusIcon status={term.masteryStatus} />
          </span>
          <div className="flex-1 min-w-0 space-y-2">
            <MarkdownContent className="text-base font-medium">
              {term.term}
            </MarkdownContent>
            <MarkdownContent className="text-sm leading-relaxed text-muted-foreground">
              {term.definition}
            </MarkdownContent>
            {term.learningSetTitle && (
              <p className="text-xs text-muted-foreground">{term.learningSetTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => toggleStar(term.id)}
            className="p-1 shrink-0 text-muted-foreground hover:text-yellow-500"
            aria-label={term.isStarred ? "Unstar" : "Star"}
          >
            <Star
              className={`h-4 w-4 ${term.isStarred ? "fill-yellow-500 text-yellow-500" : ""}`}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
