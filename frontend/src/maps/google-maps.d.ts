/**
 * Minimal Google Maps typings used by this app.
 */

declare namespace google {
  namespace maps {
    class Map {
      constructor(el: HTMLElement, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      getDiv(): HTMLElement;
    }
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latLng: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null | undefined;
      setTitle(title: string): void;
      setAnimation(animation: Animation | null): void;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      setContent(content: string | HTMLElement): void;
      open(options?: { map?: Map | null; anchor?: Marker | marker.AdvancedMarkerElement }): void;
      close(): void;
    }
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }
    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): void;
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      toJSON(): LatLngBoundsLiteral;
    }
    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: string) => void
      ): void;
    }
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      mapId?: string;
    }
    interface MarkerOptions {
      map?: Map | null;
      position?: LatLng | LatLngLiteral;
      title?: string;
      draggable?: boolean;
      animation?: Animation;
    }
    interface InfoWindowOptions {
      content?: string | HTMLElement;
      maxWidth?: number;
    }
    enum Animation {
      BOUNCE = 1,
      DROP = 2,
    }
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    interface LatLngBoundsLiteral {
      south: number;
      west: number;
      north: number;
      east: number;
    }
    interface GeocoderRequest {
      address?: string;
      placeId?: string;
      location?: LatLng | LatLngLiteral;
      language?: string;
      region?: string;
    }
    interface GeocoderResult {
      formatted_address: string;
      geometry: {
        location: LatLng;
        viewport: LatLngBounds;
      };
      place_id: string;
      name?: string;
    }
    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts?: AdvancedMarkerElementOptions);
        map: Map | null;
        position: LatLng | LatLngLiteral | null;
        title: string;
        addListener(eventName: string, handler: () => void): MapsEventListener;
      }
      interface AdvancedMarkerElementOptions {
        map?: Map | null;
        position?: LatLng | LatLngLiteral;
        title?: string;
        gmpDraggable?: boolean;
      }
    }
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): MapsEventListener;
        getPlace(): PlaceResult;
      }
      interface AutocompleteOptions {
        fields?: string[];
        componentRestrictions?: { country: string | string[] };
        types?: string[];
        language?: string;
      }
      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
          viewport?: LatLngBounds;
        };
      }
    }
    interface MapsEventListener {
      remove(): void;
    }
    namespace event {
      function clearInstanceListeners(instance: object): void;
    }
  }
}

declare const google: {
  maps: typeof google.maps;
};
