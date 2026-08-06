import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

function mockResponse(headers: HeadersInit, statusText: string, status: number, url: string) {
    const obj = {
        headers: new Headers(headers),
        status: status,
        statusText: statusText,
        url: url
    } 

    return obj as unknown as Response;
}

describe('ApiError.fromResponse', () => {
    it('retry-header exists', () => {
        const err = ApiError.fromResponse(mockResponse({ 'retry-after': '30'}, 'too many calls', 429, 'testurl'));
        expect(err.status).toBe(429);
        expect(err.message).toBe('429 too many calls — testurl');
        expect(err.retryAfter).toBe(30)
    })

    it('retry-header does not exist', () => {
        const err = ApiError.fromResponse(mockResponse({}, 'not found', 404, 'testurl'));
        expect(err.status).toBe(404);
        expect(err.message).toBe('404 not found — testurl');
        expect(err.retryAfter).toBe(undefined)
    })

    it('retry-header not numeric', () => {
        const err = ApiError.fromResponse(mockResponse({ 'retry-after': 'Thu, 6 Jul 2026 07:28:00 GMT' }, 'too many calls', 429, 'testurl'));
        expect(err.status).toBe(429);
        expect(err.message).toBe('429 too many calls — testurl');
        expect(err.retryAfter).toBe(undefined)
    })
});