export {};

declare global {
  interface GoogleMapsAPI {
    importLibrary: (library: string) => Promise<unknown>;
    StreetViewPanorama: new (
      container: HTMLElement,
      opts: Record<string, unknown>
    ) => { setVisible: (v: boolean) => void };
    event: {
      clearInstanceListeners: (instance: unknown) => void;
    };
  }

  interface Window {
    google?: {
      maps?: GoogleMapsAPI;
    };
  }
}
