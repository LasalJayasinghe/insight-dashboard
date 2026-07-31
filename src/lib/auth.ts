export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (token === null) return false;
  return !!token;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
  }
}

export const getToken = () => {
  return localStorage.getItem("token");
};

