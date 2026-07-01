export const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
    } catch {
        return null;
    }
};

export const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1000;
};

export const getTokenRemainingMs = (token) => {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return 0;
    return Math.max(0, decoded.exp * 1000 - Date.now());
};
