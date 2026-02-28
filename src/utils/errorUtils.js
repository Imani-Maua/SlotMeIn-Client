/**
 * Formats backend error messages.
 * Handles FastAPI's 422 detail (array of objects) and standard 400/404/500 strings.
 */
export const formatError = (error) => {
    const detail = error.response?.data?.detail;

    if (!detail) return 'An unexpected error occurred.';

    if (Array.isArray(detail)) {
        // FastAPI 422 validation error
        // Join the messages from each error object
        return detail.map(err => err.msg).join(', ');
    }

    if (typeof detail === 'object') {
        return JSON.stringify(detail);
    }

    return detail;
};
