import { vi } from 'vitest'

export function mockFetch({ body, ok = true, status = 200, headers, statusText, url }: { body?: unknown, ok?: boolean, status?: number, statusText?: string, url?: string, headers?: HeadersInit}) {
    const fn = vi.fn().mockResolvedValue({
        ok,
        status,
        json: () => Promise.resolve(body),
        headers: new Headers(headers),
        statusText: statusText,
        url: url
    })

    vi.stubGlobal('fetch', fn);
    return fn;
}