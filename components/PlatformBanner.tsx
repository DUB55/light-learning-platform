"use client";

import React, { useState, useEffect } from "react";

// ============================================================
// CONFIGURABLE LOGO SIZES (change these values to adjust logos)
// ============================================================
const QUIZLET_LOGO_WIDTH = 100;   // px – width of the Quizlet logo
const QUIZLET_LOGO_HEIGHT = 40;   // px – height of the Quizlet logo
const STUDYGO_LOGO_WIDTH = 130;   // px – width of the StudyGo logo
const STUDYGO_LOGO_HEIGHT = 52;   // px – height of the StudyGo logo
// ============================================================

const BUTTON_WIDTH = 260;  // px – shared button width (keeps both buttons equal)
const BUTTON_HEIGHT = 70;  // px – shared button height

const STORAGE_KEY = "platformBanner_hidden";

type HiddenState = {
  quizlet: boolean;
  studygo: boolean;
};

function loadHidden(): HiddenState {
  if (typeof window === "undefined") return { quizlet: false, studygo: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as HiddenState;
  } catch {
    // ignore
  }
  return { quizlet: false, studygo: false };
}

function saveHidden(state: HiddenState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function PlatformBanner() {
  const [hidden, setHidden] = useState<HiddenState>({
    quizlet: false,
    studygo: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHidden(loadHidden());
    setMounted(true);
  }, []);

  const hide = (platform: keyof HiddenState) => {
    const next = { ...hidden, [platform]: true };
    setHidden(next);
    saveHidden(next);
  };

  if (!mounted) return null;

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    background: "#ffffff",
    cursor: "pointer",
    transition: "box-shadow 0.2s, transform 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    textDecoration: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        justifyContent: "center",
        padding: "24px 0",
      }}
    >
      {!hidden.quizlet && (
        <a
          href="https://quizlet.com"
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
          onClick={() => hide("quizlet")}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 12px rgba(0,0,0,0.12)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 1px 3px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <img
            src="/quizlet logo_converted.jpg"
            alt="Quizlet"
            style={{
              width: QUIZLET_LOGO_WIDTH,
              height: QUIZLET_LOGO_HEIGHT,
              objectFit: "contain",
            }}
          />
        </a>
      )}

      {!hidden.studygo && (
        <a
          href="https://studygo.com"
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
          onClick={() => hide("studygo")}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 12px rgba(0,0,0,0.12)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 1px 3px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <img
            src="/studygo-logo.png"
            alt="StudyGo"
            style={{
              width: STUDYGO_LOGO_WIDTH,
              height: STUDYGO_LOGO_HEIGHT,
              objectFit: "contain",
            }}
          />
        </a>
      )}
    </div>
  );
}
