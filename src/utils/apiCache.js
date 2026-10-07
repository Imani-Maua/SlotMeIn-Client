const _cache = new Map();

export function getCached(key) {
    const entry = _cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        _cache.delete(key);
        return null;
    }
    return entry.data;
}

export function setCached(key, data, ttlMs = 5 * 60 * 1000) {
    _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidate(...keys) {
    keys.forEach(k => _cache.delete(k));
}

export function invalidatePrefixed(prefix) {
    for (const k of _cache.keys()) {
        if (k.startsWith(prefix)) _cache.delete(k);
    }
}
