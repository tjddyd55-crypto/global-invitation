/**
 * Naver Maps JS API singleton loader.
 * Editor / Preview / Public share one script and one authFailure handler.
 */

const SCRIPT_ID = 'naver-maps-js-sdk';
let loadPromise: Promise<void> | null = null;
let authFailed = false;
let pendingAuthReject: ((error: Error) => void) | null = null;

export function getNaverMapsClientId(): string {
  return (process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || '').trim();
}

export function hasNaverMapsClientId(): boolean {
  return getNaverMapsClientId().length > 0;
}

export function didNaverMapsAuthFail(): boolean {
  return authFailed;
}

export type NaverMapsMapInstance = {
  setCenter: (latlng: unknown) => void;
  setZoom?: (zoom: number) => void;
  setSize?: (size: unknown) => void;
  setOptions?: (opts: Record<string, unknown>) => void;
  autoResize?: () => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: Record<string, unknown>
        ) => NaverMapsMapInstance;
        LatLng: new (lat: number, lng: number) => unknown;
        Size: new (width: number, height: number) => unknown;
        Marker: new (opts: { position: unknown; map: unknown; title?: string }) => {
          setMap: (map: unknown | null) => void;
          setPosition?: (latlng: unknown) => void;
        };
        Service?: {
          geocode: (
            opts: { query: string },
            cb: (status: string, response: unknown) => void
          ) => void;
          Status?: { OK: string; ERROR: string };
        };
        Event?: {
          addListener: (target: unknown, event: string, handler: (...args: unknown[]) => void) => void;
          trigger: (target: unknown, event: string) => void;
        };
      };
    };
    navermap_authFailure?: () => void;
  }
}

function ensureAuthFailureHandler(): void {
  if (typeof window === 'undefined') return;
  window.navermap_authFailure = () => {
    authFailed = true;
    loadPromise = null;
    const reject = pendingAuthReject;
    pendingAuthReject = null;
    reject?.(new Error('NAVER_MAPS_AUTH_FAILURE'));
  };
}

function waitForNaverMaps(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }
    const started = Date.now();
    const poll = window.setInterval(() => {
      if (window.naver?.maps) {
        window.clearInterval(poll);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        window.clearInterval(poll);
        loadPromise = null;
        reject(new Error('NAVER_MAPS_LOAD_TIMEOUT'));
      }
    }, 50);
  });
}

export function loadNaverMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('NAVER_MAPS_SSR'));
  }
  if (authFailed) {
    return Promise.reject(new Error('NAVER_MAPS_AUTH_FAILURE'));
  }
  if (!hasNaverMapsClientId()) {
    return Promise.reject(new Error('NAVER_MAPS_CLIENT_ID_MISSING'));
  }
  if (window.naver?.maps) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    pendingAuthReject = reject;
    ensureAuthFailureHandler();

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      waitForNaverMaps()
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      getNaverMapsClientId()
    )}&submodules=geocoder`;
    script.onload = () => {
      waitForNaverMaps().then(resolve).catch(reject);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('NAVER_MAPS_SCRIPT_ERROR'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Refresh map after Preview mount / resize / visibility change. */
export function refreshNaverMapSize(map: NaverMapsMapInstance | null, container: HTMLElement | null): void {
  if (!map || !container || !window.naver?.maps) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width <= 0 || height <= 0) return;

  try {
    if (typeof map.setSize === 'function') {
      map.setSize(new window.naver.maps.Size(width, height));
    } else if (typeof map.autoResize === 'function') {
      map.autoResize();
    } else if (window.naver.maps.Event?.trigger) {
      window.naver.maps.Event.trigger(map, 'resize');
    }
  } catch {
    // ignore resize errors on teardown
  }
}

export function waitForMapContainerSize(
  element: HTMLElement,
  timeoutMs = 4000
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const read = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      return width > 0 && height > 0 ? { width, height } : null;
    };

    const immediate = read();
    if (immediate) {
      resolve(immediate);
      return;
    }

    let settled = false;
    const finish = (size: { width: number; height: number }) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      resolve(size);
    };

    const observer = new ResizeObserver(() => {
      const size = read();
      if (size) finish(size);
    });
    observer.observe(element);

    const timer = window.setTimeout(() => {
      finish(read() || { width: element.clientWidth, height: element.clientHeight });
    }, timeoutMs);

    requestAnimationFrame(() => {
      const size = read();
      if (size) finish(size);
    });
  });
}
