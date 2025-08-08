declare module 'react' {
  export function createContext<T>(defaultValue?: T): any;
  export function useContext<T>(ctx: any): T;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initial?: T | null): { current: T | null };
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: any[]): T;
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => any): any;
  export namespace React {
    interface ButtonHTMLAttributes<T> {
      className?: string;
      onClick?: (event: any) => void;
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
      children?: any;
      size?: string;
      variant?: string;
    }
    interface FormHTMLAttributes<T> {
      onSubmit?: (event: any) => void;
      className?: string;
      children?: any;
    }
    interface InputHTMLAttributes<T> {
      type?: string;
      value?: string;
      onChange?: (event: any) => void;
      placeholder?: string;
      className?: string;
      disabled?: boolean;
    }
  }
  export interface ReactNode {
    children?: any;
  }
  export const React: any;
  export function useContext<T>(ctx: any): T;
}

declare module 'next/navigation' {
  export function redirect(url: string): never;
}

declare module 'next/server' {
  export class NextRequest {
    nextUrl: {
      searchParams: URLSearchParams;
    };
  }
  export class NextResponse {
    static json(body: any, init?: any): Response;
    static redirect(url: string | URL): Response;
  }
}

declare module 'next' {
  export interface Metadata {
    title: string;
    description: string;
  }
}

declare module 'next/font/google' {
  export function Inter(options: any): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  
  interface Window {
    location: Location;
    history: History;
  }
} 