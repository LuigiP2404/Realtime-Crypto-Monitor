import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/errors';
import { describeError } from './errorMessage';

describe('describeError', () => {
    it('429 with 120s retryAfter', () => {
        const err = new ApiError('429 error', 429, 120);
        const alert = describeError(err, 'chart');
        expect(alert).toBe('Too many requests, please wait 120 seconds before trying again.')
    });

    it('429 with no retryAfter', () => {
        const err = new ApiError('429 error', 429);
        const alert = describeError(err, 'chart');
        expect(alert).toBe('Too many requests, please wait 60 seconds before trying again.')
    })

    it('status 404', () => {
        const err = new ApiError('404 page not found', 404);
        const alert = describeError(err, 'chart');
        expect(alert).toBe('Could not find chart.')
    })
    
    it('status 5xx', () => {
        const err = new ApiError('error 501', 501);
        const alert = describeError(err, 'chart');
        expect(alert).toBe('The service is temporarily unavailable, please try again later.')
    })

    it('status not handled', () => {
        const err = new ApiError('error 403', 403);
        const alert = describeError(err, 'chart');
        expect(alert).toBe('Could not load chart, please check your connection and try again.')
    })

    it('generic error (not ApiError)', () => {
        const err = new Error()
        const alert = describeError(err, 'chart');
        expect(alert).toBe('Could not load chart, please check your connection and try again.')
    })
})