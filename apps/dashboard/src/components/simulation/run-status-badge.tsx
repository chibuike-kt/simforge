import { cn, getStatusBg } from '@/lib/utils';
import { RunStatus } from '@/types';

interface RunStatusBadgeProps {
  status: RunStatus;
  showDot?: boolean;
}

export function RunStatusBadge({ status, showDot = true }: RunStatusBadgeProps) {
  const isLive = status === 'running';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        getStatusBg(status),
      )}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={cn('rounded-full w-1.5 h-1.5', isLive ? 'bg-blue-400' : 'bg-current')} />
          {isLive && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 animate-ping opacity-75" />
          )}
        </span>
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
