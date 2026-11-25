import { Music } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from './ui/cn';

/** Album cover with a gradient + note fallback when Deezer images fail. */
export function TrackCover({
  src,
  size,
  className,
  children,
}: {
  src: string;
  size: number;
  className?: string;
  children?: ReactNode;
}) {
  const [broken, setBroken] = useState(!src);
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-md', className)}
      style={{ width: size, height: size }}
    >
      {broken ? (
        <div className="bg-cover-fallback flex size-full items-center justify-center text-white">
          <Music className="size-1/2" aria-hidden />
        </div>
      ) : (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      )}
      {children}
    </div>
  );
}
