/**
 * Naver Maps JS API singleton loader.
 */

const SCRIPT_ID = 'naver-maps-js-sdk';
let loadPromise: Promise<void> | null = null;
let authFailed = false;

export function getNaverMapsClientId(): string {
  return (process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || '').trim();
}

export function hasNaverMapsClientId(): boolean {
  return getNaverMapsClientId().length > 0;
}

export function didNaverMapsAuthFail(): boolean {
  return authFailed;
}

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: {
            center: { x: number; y: number } | unknown;
            zoom: number;
          }
        ) => {
          setCenter: (latlng: unknown) => void;
          destroy?: () => void;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (opts: { position: unknown; map: unknown }) => {
          setMap: (map: unknown | null) => void;
        };
        Service?: {
          geocode: (
            opts: { query: string },
            cb: (status: string, response: unknown) => void
          ) => void;
          Status?: { OK: string; ERROR: string };
        };
        Event?: {
          addListener: (target: unknown, event: string, handler: () => void) => void;
        };
      };
    };
    navermap_authFailure?: () => void;
  }
}

export function loadNaverMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('NAVER_MAPS_SSR'));
  }
  if (!hasNaverMapsClientId()) {
    return Promise.reject(new Error('NAVER_MAPS_CLIENT_ID_MISSING'));
  }
  if (window.naver?.maps) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    window.navermap_authFailure = () => {
      authFailed = true;
      loadPromise = null;
      reject(new Error('NAVER_MAPS_AUTH_FAILURE'));
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const poll = window.setInterval(() => {
        if (window.naver?.maps) {
          window.clearInterval(poll);
          resolve();
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(poll);
        if (!window.naver?.maps) {
          loadPromise = null;
          reject(new Error('NAVER_MAPS_LOAD_TIMEOUT'));
        }
      }, 15000);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      getNaverMapsClientId()
    )}&submodules=geocoder`;
    script.onload = () => {
      const started = Date.now();
      const poll = window.setInterval(() => {
        if (window.naver?.maps) {
          window.clearInterval(poll);
          resolve();
          return;
        }
        if (Date.now() - started > 15000) {
          window.clearInterval(poll);
          loadPromise = null;
          reject(new Error('NAVER_MAPS_LOAD_TIMEOUT'));
        }
      }, 50);
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('NAVER_MAPS_SCRIPT_ERROR'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
