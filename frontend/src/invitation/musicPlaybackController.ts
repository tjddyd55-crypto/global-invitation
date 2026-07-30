/**
 * Single active invitation music playback — Editor preview / FAB 동시 재생 방지.
 */

type StopFn = () => void;

let activeStop: StopFn | null = null;

export function claimInvitationMusicPlayback(stop: StopFn | null | undefined) {
  if (!stop) return;
  if (activeStop && activeStop !== stop) {
    try {
      activeStop();
    } catch {
      // ignore previous stop errors
    }
  }
  activeStop = stop;
}

export function releaseInvitationMusicPlayback(stop: StopFn | null | undefined) {
  if (stop && activeStop === stop) {
    activeStop = null;
  }
}
