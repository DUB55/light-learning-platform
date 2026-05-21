'use client';

import React from 'react';

export default function PlatformBanner() {
  return (
    <>
      {/* StudyGo Button */}
      <a
        href="https://studygo.com/nl/learn/groups/435618/join?key=0c3cdb9"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-64 h-20 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
        style={{
          backgroundColor: '#652FA5',
          border: '2px solid #652FA5',
        }}
      >
        <img
          src="https://www-media.studygo.com/wp-content/uploads/2025/06/studygo-logo.png"
          alt="StudyGo"
          className="w-full h-full object-contain p-2"
        />
      </a>

      {/* Quizlet Button */}
      <a
        href="https://quizlet.com/join/Ea8jPMrnR?i=75vmk8&x=1bqt"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-72 z-50 flex items-center justify-center w-48 h-12 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
        style={{
          backgroundColor: '#5758FF',
          border: '2px solid #5758FF',
        }}
      >
        <img
          src="https://github.com/DUB55/light-learning-platform/blob/main/quizlet%20logo_converted.jpg?raw=true"
          alt="Quizlet"
          className="w-full h-full object-contain p-1"
        />
      </a>
    </>
  );
}
