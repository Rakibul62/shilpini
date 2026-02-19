/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq: {
      (
        action: string,
        eventName: string,
        params?: Record<
          string,
          string | number | string[] | object | undefined
        >,
      ): void;
      callMethod?: (...args: any[]) => void;
      queue: any[];
      loaded: boolean;
      version: string;
      push: (...args: any[]) => void;
    };
    _fbq: any;
  }
}

export {};
