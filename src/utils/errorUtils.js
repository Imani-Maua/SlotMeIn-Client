const STATUS_MESSAGES = {
    400: 'Bad request.',
    401: 'You are not authorised to do that.',
    403: 'Access denied.',
    404: 'Not found.',
    409: 'Conflict — this record may already exist.',
    422: 'Invalid input.',
    500: 'Something went wrong on the server. Please try again.',
    502: 'Server is unreachable. Please try again.',
    503: 'Service unavailable. Please try again.',
};

export const formatError = (error) => {
    if (!error.response) {
        return 'Network error — check your connection and try again.';
    }

    const { status, data } = error.response;
    const detail = data?.detail;

    if (detail) {
        if (Array.isArray(detail)) {
            // FastAPI 422 validation errors
            return detail.map(err => err.msg).join(', ');
        }
        if (typeof detail === 'string' && status < 500) {
            // Only surface backend strings for 4xx — never expose raw 500 messages
            return detail;
        }
    }

    return STATUS_MESSAGES[status] ?? 'An unexpected error occurred.';
};
