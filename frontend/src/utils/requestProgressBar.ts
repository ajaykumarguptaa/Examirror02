type ProgressListener = (progress: number, isVisible: boolean) => void;

class RequestProgressBarManager {
  private inFlightRequests: number = 0;
  private progress: number = 0;
  private isVisible: boolean = false;
  private trickleTimer: any = null;
  private hideTimer: any = null;
  private listeners: Set<ProgressListener> = new Set();

  /**
   * Subscribe to progress bar updates
   */
  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener(this.progress, this.isVisible);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.progress, this.isVisible));
  }

  /**
   * Start / increment request counter
   */
  public start() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.inFlightRequests++;

    if (this.inFlightRequests === 1) {
      this.isVisible = true;
      // Start with responsive initial jump
      this.progress = 20;
      this.notify();

      if (this.trickleTimer) clearInterval(this.trickleTimer);

      // Smooth mathematical trickle easing towards 92%
      this.trickleTimer = setInterval(() => {
        if (this.progress < 90) {
          // Asymptotically approach 90%
          const step = Math.max(1, (90 - this.progress) * 0.12);
          this.progress = Math.min(90, Math.round(this.progress + step));
          this.notify();
        }
      }, 180);
    }
  }

  /**
   * Complete / decrement request counter
   */
  public complete() {
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);

    if (this.inFlightRequests === 0) {
      if (this.trickleTimer) {
        clearInterval(this.trickleTimer);
        this.trickleTimer = null;
      }

      // Snap to 100% completion
      this.progress = 100;
      this.notify();

      // Gracefully fade out and reset
      this.hideTimer = setTimeout(() => {
        this.isVisible = false;
        this.notify();

        this.hideTimer = setTimeout(() => {
          this.progress = 0;
          this.notify();
        }, 300);
      }, 250);
    }
  }

  /**
   * Force reset all progress states (e.g. on navigation reset)
   */
  public reset() {
    if (this.trickleTimer) clearInterval(this.trickleTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.inFlightRequests = 0;
    this.progress = 0;
    this.isVisible = false;
    this.notify();
  }
}

export const requestProgressBar = new RequestProgressBarManager();
