/**
 * Next.js Middleware Adapter
 * 
 * In Next.js 16+, Middleware is officially named Proxy (see proxy.ts).
 * This file re-exports proxy.ts to maintain backward compatibility with Next.js 14.
 */
export { default, config } from './proxy';
