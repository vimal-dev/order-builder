export interface IUser {
    identifier: string|number|null;
    name: string|null;
    role?: string|null;
    permissions?: Array<string>;
    [key: string]: any;
}

export type AuthContextType = {
    user: IUser|null,
    token: string|null,
    refresh_token: string|null,
    tokenExpiresIn: () => number,
    isTokenExpired: () => boolean,
    login: (token: string, refresh_token: string|null) => void;
    refreshAccessToken: () => Promise<string|null>;
    updateTokens: (token: string, refresh_token: string|null) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    hasRole: (role: string) => boolean;
}
