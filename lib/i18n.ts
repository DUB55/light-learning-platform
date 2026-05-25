// Language is always Dutch. English translations are kept for reference only.
// The user cannot change the language.
import { NL_FALLBACKS } from "./i18n-nl-fallbacks";

export type Language = 'en' | 'nl';

export interface Translation {
  [key: string]: string;
}

class I18n {
  private translations: Record<Language, Translation> = {} as Record<Language, Translation>;
  // Always Dutch — never read from localStorage
  private readonly currentLanguage: Language = 'nl';
  private loaded = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        this.translations.en = {};
        this.translations.nl = {};
        this.loaded = true;
        return;
      }

      // Only need Dutch, but load both so existing code referencing 'en' doesn't break
      const [enResponse, nlResponse] = await Promise.all([
        fetch('/locales/en.csv'),
        fetch('/locales/nl.csv'),
      ]);

      this.translations.en = enResponse.ok
        ? this.parseCSV(await enResponse.text())
        : {};

      this.translations.nl = nlResponse.ok
        ? this.parseCSV(await nlResponse.text())
        : {};

      // Never read saved language — always stay Dutch
      // Clear any stale 'en' value that might have been saved previously
      try { localStorage.removeItem('language'); } catch {}

    } catch (error) {
      console.error('Failed to load translations:', error);
      this.translations.en = {};
      this.translations.nl = {};
    } finally {
      this.loaded = true;
      this.listeners.forEach((fn) => fn());
      this.listeners = [];
    }
  }

  private parseCSV(csvText: string): Translation {
    const lines = csvText.split('\n');
    const translations: Translation = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, ...textParts] = line.split(',');
        const text = textParts.join(',').replace(/"/g, '').trim();
        if (id && text) {
          translations[id.trim()] = text;
        }
      }
    }
    return translations;
  }

  public onLoaded(fn: () => void): void {
    if (this.loaded) {
      fn();
    } else {
      this.listeners.push(fn);
    }
  }

  // No-op: language switching is disabled. Always Dutch.
  public setLanguage(_language: Language): void {}

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public t(id: string, fallback?: string): string {
    const translation = this.translations['nl']?.[id];
    const nlFallback = NL_FALLBACKS[id];
    return translation || nlFallback || fallback || id;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

// Singleton
export const i18n = new I18n();

// Hook for React components
export function useTranslation() {
  const [translationsReady, setTranslationsReady] = useState(false);

  useEffect(() => {
    i18n.onLoaded(() => {
      setTranslationsReady(true);
    });
  }, []);

  // t is recreated when translationsReady flips, triggering a re-render
  // in every component so Dutch strings replace the fallbacks.
  const t = useCallback(
    (id: string, fallback?: string) => i18n.t(id, fallback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translationsReady]
  );

  // changeLanguage kept for API compatibility but does nothing
  const changeLanguage = (_language: Language) => {};

  return { t, currentLanguage: 'nl' as Language, changeLanguage, translationsReady };
}

import { useState, useEffect, useCallback } from 'react';
