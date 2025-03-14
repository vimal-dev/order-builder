export interface IAuthOrder {
    identifier: string|number|null;
    order_number: string|number|null;
    email: string|null;
    [key: string]: any;
}

export type FrontAuthContextType = {
    order: IAuthOrder|null,
    token: string|null,
    refresh_token: string|null,
    tokenExpiresIn: () => number,
    isTokenExpired: () => boolean,
    login: (token: string, refresh_token: string|null) => void;
    refreshAccessToken: () => Promise<string|null>;
    updateTokens: (token: string, refresh_token: string|null) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}
