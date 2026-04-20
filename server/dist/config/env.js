"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
function parsePort(value) {
    if (!value)
        return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return null;
    return parsed;
}
function getEnv() {
    const errors = [];
    const nodeEnv = process.env.NODE_ENV || "development";
    const port = parsePort(process.env.PORT);
    if (!port)
        errors.push("PORT");
    const databaseUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
    if (!databaseUrl)
        errors.push("DATABASE_URL");
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        errors.push("JWT_SECRET");
    const corsOrigin = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    const publicBaseUrl = process.env.PUBLIC_BASE_URL?.trim() || undefined;
    const sslKeyPath = process.env.SSL_KEY_PATH?.trim() || undefined;
    const sslCertPath = process.env.SSL_CERT_PATH?.trim() || undefined;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET?.trim() || undefined;
    if (errors.length > 0) {
        console.error(`Missing/invalid environment variables: ${errors.join(", ")}`);
        return null;
    }
    return {
        nodeEnv,
        port,
        databaseUrl,
        jwtSecret,
        refreshTokenSecret,
        corsOrigin,
        publicBaseUrl,
        sslKeyPath,
        sslCertPath,
    };
}
