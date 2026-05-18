import { useState } from 'react';
import Icon from './Icon';

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
      className={`inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-sm font-black uppercase transition ${
        bookmarked
          ? 'border-accent bg-accent text-paper hover:bg-accent/90'
          : 'border-ink/20 text-ink hover:border-ink'
      }`}
    >
      <Icon name="bookmark" className="h-4 w-4" />
      {bookmarked ? 'Marcado' : 'Guardar marcador'}
    </button>
  );
}

export default BookmarkButton;
