'use client';

import React, { useState, useEffect } from 'react';

// ============================================================
// CONFIGURABLE LOGO SIZES (change these values to adjust logos)
// ============================================================
const QUIZLET_LOGO_WIDTH = 120;   // px – width of the Quizlet logo image
const QUIZLET_LOGO_HEIGHT = 48;   // px – height of the Quizlet logo image
const STUDYGO_LOGO_WIDTH = 540;   // px – width of the StudyGo logo image
const STUDYGO_LOGO_HEIGHT = 132;   // px – height of the StudyGo logo image
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
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-32 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
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
          className="fixed bottom-4 right-40 z-50 flex items-center justify-center w-32 h-10 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
          style={{
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
