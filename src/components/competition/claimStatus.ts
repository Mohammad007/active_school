import type { Tone } from '@/components/ui';
import type { IconName } from '@/lib/icons';
import type { RewardClaim } from '@/types';

/** Tone + icon for a reward claim status. */
export function claimTone(status: RewardClaim['status']): { tone: Tone; icon: IconName } {
  switch (status) {
    case 'available':
      return { tone: 'accent', icon: 'gift' };
    case 'completed':
      return { tone: 'success', icon: 'checkmark-circle' };
    case 'dispatched':
      return { tone: 'info', icon: 'cube-outline' };
    case 'rejected':
    case 'expired':
      return { tone: 'danger', icon: 'close-circle' };
    default:
      return { tone: 'warning', icon: 'time-outline' };
  }
}
