"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  password: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userData: UserData | null) => void;
}

export function AuthModal({ isOpen, onClose, onComplete }: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Load saved credentials if remember me was checked
      const savedCredentials = localStorage.getItem("user_credentials");
      if (savedCredentials) {
        const credentials = JSON.parse(savedCredentials);
        if (credentials.rememberMe) {
          setName(credentials.name || "");
          setEmail(credentials.email || "");
          setPassword(credentials.password || "");
          setRememberMe(true);
        }
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Naam is verplicht");
      return;
    }

    if (!email.trim()) {
      setError("E-mail is verplicht");
      return;
    }

    if (!password.trim()) {
      setError("Wachtwoord is verplicht");
      return;
    }

    // Save credentials locally if remember me is checked
    if (rememberMe) {
      localStorage.setItem(
        "user_credentials",
        JSON.stringify({ name, email, password, rememberMe })
      );
    } else {
      localStorage.removeItem("user_credentials");
    }

    // Save user data for analytics
    localStorage.setItem("user_data", JSON.stringify({ name, email }));

    onComplete({ name, email, password });
    onClose();
  };

  const handleSkip = () => {
    onComplete(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Welkom</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Naam
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Vul je naam in"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Vul je e-mail in"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Wachtwoord
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Maak een wachtwoord aan"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
              Onthoud mij
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Doorgaan
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">of</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Overslaan en doorgaan als gast
          </button>
        </form>
      </div>
    </div>
  );
}
