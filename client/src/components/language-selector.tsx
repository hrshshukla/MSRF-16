import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/lib/language-context";

const languageOptions: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
];

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = languageOptions.find((option) => option.value === language) ?? languageOptions[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function chooseLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setIsOpen(false);
  }

  return (
    <div
      ref={selectorRef}
      className={`relative flex items-center justify-between gap-3 ${compact ? "w-full" : "rounded-lg px-3 py-2.5"}`}
    >
      <span className="flex items-center gap-3 text-sm font-medium text-foreground">
        <Languages size={compact ? 16 : 18} className="text-primary" aria-hidden="true" />
        <span>Language</span>
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Language"
        className={`inline-flex min-w-32 items-center justify-between gap-2 rounded-lg border border-primary/20 bg-background px-2.5 py-1.5 text-left text-sm font-semibold text-foreground outline-none transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 ${
          compact ? "min-w-28" : "min-w-32"
        }`}
      >
        <span>{selectedLanguage.label}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 top-full z-[60] mt-2 min-w-32 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl"
        >
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={language === option.value}
              onClick={() => chooseLanguage(option.value)}
              className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-none"
            >
              <span>{option.label}</span>
              {language === option.value && <Check size={15} className="shrink-0 text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
