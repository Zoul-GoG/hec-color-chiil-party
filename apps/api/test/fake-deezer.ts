import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FetchFn } from '../src/deezer/deezer.types';

export function fixture<T = unknown>(name: string): T {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf8')) as T;
}

type Handler = (url: URL) => unknown | Promise<unknown>;

/**
 * Fake Deezer backed by the recorded fixtures. Every call is recorded in `calls`;
 * `override(pathPrefix, handler)` changes the answer for a path.
 */
export class FakeDeezer {
  readonly calls: string[] = [];
  private readonly overrides: [string, Handler][] = [];
  delayMs = 0;

  readonly fetch: FetchFn = async (input) => {
    const url = new URL(input);
    this.calls.push(url.pathname + url.search);
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    const override = this.overrides.find(([prefix]) => url.pathname.startsWith(prefix));
    const body = override ? await override[1](url) : this.defaultBody(url);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  override(pathPrefix: string, handler: Handler): this {
    this.overrides.unshift([pathPrefix, handler]);
    return this;
  }

  reset(): void {
    this.calls.length = 0;
    this.overrides.length = 0;
    this.delayMs = 0;
  }

  count(pathPrefix: string): number {
    return this.calls.filter((c) => c.startsWith(pathPrefix)).length;
  }

  private defaultBody(url: URL): unknown {
    const p = url.pathname;
    if (p === '/search') return fixture('deezer-search-bahi.json');
    if (p === '/track/745229932') return fixture('deezer-track.json');
    if (p === '/track/1014597302') return fixture('deezer-track-alt.json');
    if (p.startsWith('/album/')) return fixture('deezer-album.json');
    return fixture('deezer-error-not-found.json');
  }
}
