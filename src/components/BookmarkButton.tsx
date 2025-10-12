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
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        bookmarked
          ? 'border border-accent/60 bg-accent/10 text-accent hover:bg-accent/20'
          : 'border border-slate-700 text-slate-200 hover:border-primary hover:text-primary'
      }`}
    >
      <span aria-hidden>{bookmarked ? '⭐' : '☆'}</span>
      {bookmarked ? 'Guardado en favoritos' : 'Guardar para después'}
    </button>
  );
}

export default BookmarkButton;
