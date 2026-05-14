/**
 * Safe, non-secret configuration snapshot for the admin console.
 */
exports.getAdminSettings = async (req, res) => {
    try {
        const integrations = {
            emailConfigured: Boolean(
                (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) ||
                    (process.env.SMTP_USER && process.env.SMTP_PASSWORD)
            ),
            googleOAuthConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
            stripeHint: Boolean(
                process.env.STRIPE_SECRET_KEY ||
                    process.env.STRIPE_PUBLISHABLE_KEY ||
                    process.env.STRIPE_SECRET
            ),
        };

        const security = {
            jwtAccessConfigured: Boolean(process.env.JWT_SECRET),
            jwtRefreshConfigured: Boolean(process.env.JWT_REFRESH_SECRET),
            adminJwtConfigured: Boolean(process.env.ADMIN_JWT_SECRET),
        };

        const flags = [
            integrations.emailConfigured,
            integrations.googleOAuthConfigured,
            integrations.stripeHint,
            security.jwtAccessConfigured,
            security.jwtRefreshConfigured,
            security.adminJwtConfigured,
        ];
        const passed = flags.filter(Boolean).length;
        const total = flags.length;
        const readinessScore = Math.round((passed / total) * 100);

        const production = (process.env.NODE_ENV || 'development') === 'production';
        const recommendations = [];
        if (!security.jwtRefreshConfigured) {
            recommendations.push({
                id: 'jwt-refresh',
                severity: production ? 'warning' : 'info',
                title: 'Use a dedicated JWT refresh secret',
                detail:
                    'Set JWT_REFRESH_SECRET in production so refresh tokens cannot be forged if the user JWT secret leaks.',
            });
        }
        if (!integrations.emailConfigured) {
            recommendations.push({
                id: 'email',
                severity: 'info',
                title: 'Configure outbound email',
                detail: 'Needed for OTP, password reset, and order notifications.',
            });
        }
        if (!process.env.FRONTEND_URL) {
            recommendations.push({
                id: 'cors',
                severity: 'warning',
                title: 'Set FRONTEND_URL',
                detail: 'CORS and email templates rely on this URL. Defaults may not match your storefront.',
            });
        }

        return res.json({
            success: true,
            data: {
                nodeEnv: process.env.NODE_ENV || 'development',
                frontendUrl: process.env.FRONTEND_URL || null,
                baseUrl: process.env.BASE_URL || null,
                port: process.env.PORT || '8080',
                databaseName: process.env.DB_NAME || null,
                corsOriginConfigured: Boolean(process.env.FRONTEND_URL),
                integrations,
                security,
                readiness: {
                    score: readinessScore,
                    passed,
                    total,
                },
                server: {
                    timeUtc: new Date().toISOString(),
                    uptimeSeconds: Math.floor(process.uptime()),
                    timezone:
                        process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                },
                recommendations,
                hints: {
                    message:
                        'Secrets are never returned from this endpoint. Rotate keys from your secrets manager or .env on the host.',
                },
            },
        });
    } catch (error) {
        console.error('getAdminSettings:', error);
        return res.status(500).json({ success: false, message: 'Failed to load settings' });
    }
};
