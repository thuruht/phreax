// Minimal shims for missing packages and runtime types so TS can build offline.
// These are intentionally small — replace with upstream types when devDependencies
// are available (npm install). Included via tsconfig include: src/**/*

declare module 'hono' {
  export type Next = () => Promise<void>;

  export interface RequestLike {
    json<T = any>(): Promise<T>;
    formData(): Promise<FormData>;
    param(name?: string): string;
    path: string;
    url: string;
    raw?: Request;
    header(name: string): string | null;
    method: string;
  }

  export interface Context<Bindings = any> {
    req: RequestLike;
    env: Bindings & Record<string, any>;
    set(key: string, value: any): void;
    json<T = any>(body: T, status?: number): Response;
    header(name: string, value: string): void;
    text(body: string, status?: number): Response;
  }

  export class Hono<Bindings = any> {
    use(path: string, handler: any): this;
    route(path: string, router: any): this;
    get(path: string, handler: (c: Context<Bindings>) => any): this;
    post(path: string, handler: (c: Context<Bindings>) => any): this;
    put(path: string, handler: (c: Context<Bindings>) => any): this;
    delete(path: string, handler: (c: Context<Bindings>) => any): this;
  }

  export { Context };
}

declare module 'hono/cookie' {
  export function getCookie(req: any, name: string): string | undefined;
  export function setCookie(res: any, name: string, value: string, opts?: any): void;
  export function deleteCookie(res: any, name: string, opts?: any): void;
}

// Minimal shape for Cloudflare D1 in this project. This satisfies the local
// helpers (prepare(...).bind(...).all/run).
declare type D1Statement = {
  bind(...params: any[]): {
    all<T = any>(): Promise<{ results: T[] }>; 
    run(): Promise<any>;
  };
};

declare type D1Database = {
  prepare(query: string): D1Statement;
};

// Minimal R2 bucket interface used in the code
declare type R2ObjectBody = any;
declare interface R2Bucket {
  put(key: string, body: R2ObjectBody, opts?: any): Promise<void>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<void>;
}

