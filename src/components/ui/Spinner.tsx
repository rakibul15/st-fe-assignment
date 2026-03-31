import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 40, label = 'Loading...' }: SpinnerProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-label={label}
    >
      <Loader2
        size={size}
        color="var(--primary)"
        className="animate-spin mb-4"
      />
      <p className="text-[var(--text-muted)] text-sm">{label}</p>
    </div>
  );
}
