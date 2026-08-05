export class ApiError extends Error {
    status: number;
    retryAfter?: number;

    constructor(message: string, status: number, retryAfter?: number) {
        super(message);

        this.name = 'ApiError';
        this.status = status;
        this.retryAfter = retryAfter;
    }

    // the message carries diagnostic facts for the console, the user facing copy
    // is built by the caller from `status`
    static fromResponse(res: Response): ApiError {
        const raw = res.headers.get('retry-after');
        const seconds = raw === null ? NaN : Number(raw);
        const retryAfter = Number.isFinite(seconds) ? seconds : undefined;
        return new ApiError(`${res.status} ${res.statusText} — ${res.url}`, res.status, retryAfter);
    }
}
