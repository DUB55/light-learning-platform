export type Language = 'en' | 'nl';

export interface Translation {
  [key: string]: string;
}

class I18n {
  private translations: Record<Language, Translation> = {} as Record<Language, Translation>;
  private currentLanguage: Language = 'nl';

  constructor() {
    this.loadTranslations();
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load English translations
      const enResponse = await fetch('/locales/en.csv');
      if (!enResponse.ok) {
        console.warn('English translations not found, using empty translations');
        this.translations.en = {};
      } else {
        const enText = await enResponse.text();
        this.translations.en = this.parseCSV(enText);
      }

      // Load Dutch translations
      const nlResponse = await fetch('/locales/nl.csv');
      if (!nlResponse.ok) {
        console.warn('Dutch translations not found, using empty translations');
        this.translations.nl = {};
      } else {
        const nlText = await nlResponse.text();
        this.translations.nl = this.parseCSV(nlText);
      }

      // Load saved language preference
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'nl')) {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      this.translations.en = {};
      this.translations.nl = {};
    }
  }

  private parseCSV(csvText: string): Translation {
    const lines = csvText.split('\n');
    const translations: Translation = {};
    
    // Skip header line
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

  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public t(id: string, fallback?: string): string {
    const translation = this.translations[this.currentLanguage]?.[id];
    return translation || fallback || id;
  }

  public isLoaded(): boolean {
    return Object.keys(this.translations).length > 0;
  }
}

// Create singleton instance
export const i18n = new I18n();

// Hook for React components
export function useTranslation() {
  const [translationsReady, setTranslationsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const checkTranslations = () => {
      if (i18n.isLoaded()) {
        setTranslationsReady(true);
        setCurrentLanguage(i18n.getCurrentLanguage());
      } else {
        setTimeout(checkTranslations, 100);
      }
    };

    checkTranslations();

    const handleLanguageChanged = () => {
      setCurrentLanguage(i18n.getCurrentLanguage());
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => window.removeEventListener('languageChanged', handleLanguageChanged);
  }, []);

  const changeLanguage = (language: Language) => {
    i18n.setLanguage(language);
    setCurrentLanguage(language);
  };

  const t = (id: string, fallback?: string) => {
    return i18n.t(id, fallback);
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    translationsReady
  };
}

// Import React hooks
import { useState, useEffect } from 'react';
