declare module 'next/navigation' {
  // Minimal router type to satisfy TypeScript during builds on environments
  // where the type definitions for useRouter might be missing.
  export function useRouter(): {
    push: (href: string) => void
    replace: (href: string) => void
    refresh: () => void
    back: () => void
    forward: () => void
  }

  // Minimal params and pathname helpers used across client pages
  export function useParams<TParams = any>(): TParams
  export function usePathname(): string
  export function redirect(url: string): never
}


