'use client';

import React, { useState, useEffect } from 'react';

// ============================================================
// CONFIGURABLE SIZES (change these values to adjust)
// ============================================================

// Button size (both buttons share the same dimensions)
const BUTTON_WIDTH = 192;          // px – button width  (original Quizlet size)
const BUTTON_HEIGHT = 48;          // px – button height (original Quizlet size)

// Logo image sizes (independent of button size)
const QUIZLET_LOGO_WIDTH = 160;    // px – Quizlet logo width
const QUIZLET_LOGO_HEIGHT = 40;    // px – Quizlet logo height
const STUDYGO_LOGO_WIDTH = 180;    // px – StudyGo logo width  (bigger logo)
const STUDYGO_LOGO_HEIGHT = 44;    // px – StudyGo logo height (bigger logo)

// ============================================================

const STORAGE_KEY = 'platformBanner_hidden';

type HiddenState = {
  quizlet: boolean;
  studygo: boolean;
};

function loadHidden(): HiddenState {
  if (typeof window === 'undefined') return { quizlet: false, studygo: false };
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

  return (
    <>
      {/* StudyGo Button */}
      {!hidden.studygo && (
        <a
          href="https://studygo.com/nl/learn/groups/435618/join?key=0c3cdb9"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            hide('studygo');
            window.open('https://studygo.com/nl/learn/groups/435618/join?key=0c3cdb9', '_blank');
          }}
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            backgroundColor: '#652FA5',
            border: '2px solid #652FA5',
          }}
        >
          <img
            src="https://www-media.studygo.com/wp-content/uploads/2025/06/studygo-logo.png"
            alt="StudyGo"
            style={{
              width: STUDYGO_LOGO_WIDTH,
              height: STUDYGO_LOGO_HEIGHT,
              objectFit: 'contain',
            }}
          />
        </a>
      )}

      {/* Quizlet Button */}
      {!hidden.quizlet && (
        <a
          href="https://quizlet.com/join/Ea8jPMrnR?i=75vmk8&x=1bqt"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            hide('quizlet');
            window.open('https://quizlet.com/join/Ea8jPMrnR?i=75vmk8&x=1bqt', '_blank');
          }}
          className="fixed bottom-4 z-50 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            right: BUTTON_WIDTH + 32,
            backgroundColor: '#5758FF',
            border: '2px solid #5758FF',
          }}
        >
          <img
            src="https://github.com/DUB55/light-learning-platform/blob/main/quizlet%20logo_converted.jpg?raw=true"
            alt="Quizlet"
            style={{
              width: QUIZLET_LOGO_WIDTH,
              height: QUIZLET_LOGO_HEIGHT,
              objectFit: 'contain',
            }}
          />
        </a>
      )}
    </>
  );
}
