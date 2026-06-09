import React from 'react';

const parseDocument = (content) => {
  const normalized = String(content || '').replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return { title: '', paragraphs: [] };
  }

  const parts = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const [firstPart = '', ...restParts] = parts;
  const firstLines = firstPart
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const title = firstLines.shift() || '';
  const paragraphs = [
    ...(firstLines.length ? [firstLines.join('\n')] : []),
    ...restParts,
  ].filter(Boolean);

  return { title, paragraphs };
};

const LoadingState = () => (
  <div className="mx-auto max-w-4xl px-4 py-10 md:py-12">
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200/70" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200/60" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200/60" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200/60" />
      </div>
    </div>
  </div>
);

export default function LegalDocumentPage({ content, loading = false, fallbackLabel = 'Content unavailable.' }) {
  if (loading) {
    return <LoadingState />;
  }

  const { title, paragraphs } = parseDocument(content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-12">
      <article className="space-y-6">
        {title && (
          <header className="border-b border-[var(--stroke)] pb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--coal)] sm:text-3xl">
              {title}
            </h1>
          </header>
        )}

        <div className="space-y-5 text-[15px] leading-8 text-slate-700">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm text-slate-500">{fallbackLabel}</p>
          )}
        </div>
      </article>
    </div>
  );
}
