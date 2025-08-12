declare module '@ai-sdk/openai' {
  export function openai(model: string): any;
}

declare module 'ai' {
  export function streamText(options: any): any;
  export function generateText(options: any): any;
  export function tool(options: any): any;
}

declare module 'ai/react' {
  export function useChat(options?: any): {
    messages: any[];
    input: string;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
    isLoading: boolean;
    setMessages: (msgs: any[]) => void;
  };
}

declare module 'zod' {
  export const z: any;
}

declare module 'date-fns' {
  export function format(date: Date | string, formatStr: string): string;
  export function parseISO(dateString: string): Date;
  export function subDays(date: Date, amount: number): Date;
  export function subMonths(date: Date, amount: number): Date;
  export function startOfMonth(date: Date): Date;
  export function endOfMonth(date: Date): Date;
}

declare module 'clsx' {
  export type ClassValue = string | number | boolean | undefined | null | ClassValue[];
  export function clsx(...inputs: ClassValue[]): string;
}

declare module 'tailwind-merge' {
  export function twMerge(...classLists: string[]): string;
}

declare module 'lucide-react' {
  export const AlertCircle: any;
  export const CheckCircle: any;
  export const Send: any;
  export const Loader2: any;
  export const Settings: any;
} 