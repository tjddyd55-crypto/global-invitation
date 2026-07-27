import { getGoogleMapsApiKey } from './config';

type GoogleMapsWindow = Window & {
  google?: typeof google;
  __giMapsPromise?: Promise<typeof google.maps>;
  __giMapsInit?: () => void;
};

function resolveMapsLanguage(): string {
  if (typeof document === 'undefined') return 'en';
  const lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('mn')) return 'mn';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('zh')) return 'zh-TW';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}

/**
 * Maps JavaScript API 싱글톤 로더 (Places + Marker library).
 * 전 세계 Places — region/country 강제 없음.
 */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps는 브라우저에서만 로드됩니다.'));
  }

  const w = window as GoogleMapsWindow;
  if (w.google?.maps?.places) {
    return Promise.resolve(w.google.maps);
  }
  if (w.__giMapsPromise) {
    return w.__giMapsPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY가 없습니다.'));
  }

  const language = resolveMapsLanguage();

  w.__giMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gi-google-maps="1"]');
    if (existing) {
      const check = () => {
        if (w.google?.maps?.places) {
          resolve(w.google.maps);
          return;
        }
        window.setTimeout(check, 50);
      };
      check();
      return;
    }

    w.__giMapsInit = () => {
      if (w.google?.maps) {
        resolve(w.google.maps);
      } else {
        reject(new Error('Google Maps 초기화에 실패했습니다.'));
      }
    };

    const script = document.createElement('script');
    script.dataset.giGoogleMaps = '1';
    script.async = true;
    script.defer = true;
    // places + marker (AdvancedMarkerElement). Map ID는 선택 — 없어도 classic Marker 사용.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&language=${encodeURIComponent(language)}&v=weekly&callback=__giMapsInit`;
    script.onerror = () => {
      w.__giMapsPromise = undefined;
      reject(new Error('Google Maps 스크립트 로드에 실패했습니다.'));
    };
    document.head.appendChild(script);
  });

  return w.__giMapsPromise;
}
