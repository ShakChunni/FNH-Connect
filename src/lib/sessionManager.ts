// Session check manager to prevent race conditions
export class SessionManager {
  private static instance: SessionManager;
  private checkPromise: Promise<any> | null = null;
  private lastCheckTime = 0;
  private generation = 0;
  constructor(
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
    private readonly now: () => number = () => Date.now(),
  ) {}

  private readonly CHECK_INTERVAL = 5000; // 5 seconds minimum between checks

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async checkSession(force = false): Promise<any> {
    const now = this.now();

    // If we have a check in progress and this isn't forced, return that promise
    if (this.checkPromise && !force) {
      return this.checkPromise;
    }

    // If we just checked recently and this isn't forced, skip
    if (!force && now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return null;
    }

    // Create new check promise
    const generation = this.generation;
    const promise = this.performCheck().then((result) =>
      generation === this.generation ? result : null,
    );
    this.checkPromise = promise;
    this.lastCheckTime = now;

    try {
      const result = await promise;
      return result;
    } finally {
      // Clear the promise after completion
      if (this.checkPromise === promise) this.checkPromise = null;
    }
  }

  private async performCheck() {
    const res = await this.fetcher("/api/auth/verify-session", {
      credentials: "include",
      cache: "no-cache", // Prevent caching
    });

    if (!res.ok) {
      if (res.status === 401) return { success: false, valid: false };
      throw new Error(`Session check failed: ${res.status}`);
    }

    return res.json();
  }

  reset() {
    this.generation++;
    this.checkPromise = null;
    this.lastCheckTime = 0;
  }
}
