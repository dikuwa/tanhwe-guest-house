"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!faqs.length) return null;

  return (
    <section className="mx-auto max-w-[1180px] px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Questions &amp; Answers</p>
        <h2 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Quick answers to the most common questions about your stay at Tanhwe Guest House.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <FaqItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={isOpen}
              onToggle={() => setOpenId(isOpen ? null : faq.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white shadow-xs transition-shadow hover:shadow-sm"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50/50"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="pr-2 text-sm font-medium text-neutral-800 sm:text-base">{question}</span>
        <span className="shrink-0 text-primary transition-transform duration-200" aria-hidden="true">
          {isOpen ? (
            <Minus className="size-5 rounded-full border border-primary p-0.5" />
          ) : (
            <Plus className="size-5 rounded-full border border-primary p-0.5" />
          )}
        </span>
      </button>
      <div
        id={`faq-answer-${question.replace(/\s+/g, "-").toLowerCase()}`}
        role="region"
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? height : 0 }}
      >
        <div ref={contentRef} className="border-t border-neutral-100 px-5 py-4">
          <p className="text-sm leading-6 text-neutral-600">{answer}</p>
        </div>
      </div>
    </div>
  );
}
