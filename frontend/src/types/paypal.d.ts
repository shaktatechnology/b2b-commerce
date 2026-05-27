declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => {
        render: (selector: string | HTMLElement) => Promise<void>;
        close?: () => Promise<void>;
      };
    };
  }
}

export {};
