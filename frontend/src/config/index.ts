const config = {
    isProduction: import.meta.env.NODE_ENV === "production",
    isDevelopment: import.meta.env.NODE_ENV !== "production",
    title: import.meta.env.VITE_APP_TITLE || "Demo",
    apiBase: import.meta.env.VITE_API_ENDPOINT,
    authRedirect: '/login',
    authSuccessRedirect: '/',
    apiEndpoints: {
        login: '/auth/login',
        otp: '/auth/login/verify',
        refreshToken: '/auth/token/refresh',
        register: '/auth/register',
        forgot: null,
        reset: null,
        store: {
            isConnected: '/shopify/is-connected',
            connect: '/shopify/subscribe',
        },
    },
}

export default config;