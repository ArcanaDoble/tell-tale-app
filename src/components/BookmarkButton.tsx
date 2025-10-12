import { useState } from 'react';

interface BookmarkButtonProps {
  resourceId: string;
}

function BookmarkButton({ resourceId }: BookmarkButtonProps): JSX.Element {
  const storageKey = `bookmark:${resourceId}`;
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(storageKey) === 'true';
  });

  const toggleBookmark = (): void => {
    setBookmarked((current) => {
      const next = !current;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, next.toString());
      }
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        bookmarked
          ? 'border border-accent/80 bg-accent/20 text-white shadow-glow-accent hover:bg-accent/30'
          : 'border border-white/10 bg-white/[0.04] text-slate-200 hover:border-primary/60 hover:text-primary'
      }`}
    >
      <span aria-hidden>{bookmarked ? '⭐' : '☆'}</span>
      {bookmarked ? 'Guardado' : 'Guardar'}
    </button>
  );
}

export default BookmarkButton;
