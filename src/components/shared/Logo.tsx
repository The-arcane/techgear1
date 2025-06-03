import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Zap className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-foreground font-headline">
        TechGear
      </span>
    </Link>
  );
}
