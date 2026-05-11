// agro-notes/src/components/ui/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  href?: string;
  label?: string;
};

export function BackButton({ href, label = "Volver" }: BackButtonProps) {
  const router = useRouter();

  const go = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      className="
        inline-flex items-center gap-1.5
        text-xs sm:text-sm font-medium
        text-fg-muted hover:text-fg
        bg-transparent hover:bg-card-hover
        border border-border-subtle hover:border-border-strong
        rounded-md px-3 py-1.5
        transition-colors
        cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page
      "
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
