const TOKEN_KEY = "token";

export const tokenService = {
  get: () => localStorage.getItem(TOKEN_KEY),

  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),

  clear: () => localStorage.removeItem(TOKEN_KEY),
};
