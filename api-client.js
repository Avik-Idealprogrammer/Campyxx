(function initializeCampusApi(global) {
  const DEFAULT_TIMEOUT_MS = 15000;

  function formatStatusError(status, detail) {
    if (typeof detail === "string" && detail.trim().length > 0) return detail;
    if (detail && typeof detail.message === "string") return detail.message;
    switch (status) {
      case 400: return "Invalid request. Please check the submitted information.";
      case 401: return "Authentication required or session expired. Please sign in again.";
      case 403: return "Access denied. You do not have permission for this portal or action.";
      case 404: return "The requested record or resource was not found.";
      case 409: return "Conflict: A conflicting booking, registration, or schedule record already exists.";
      case 422: return "Validation failed. Please verify that all fields meet requirements.";
      case 429: return "Too many requests. Please wait a moment and try again.";
      case 500: return "Internal server error. Please try again shortly.";
      case 502: return "Bad gateway. The server is temporarily unreachable.";
      case 503: return "Service temporarily unavailable. Please try again shortly.";
      default: return "The request could not be completed.";
    }
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body !== undefined && !(typeof FormData !== "undefined" && options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;
    let timer = null;

    if (controller && timeoutMs > 0) {
      timer = setTimeout(() => controller.abort(), timeoutMs);
    }

    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers,
        credentials: "same-origin",
        signal: controller ? controller.signal : undefined,
        body: options.body === undefined
          ? undefined
          : (typeof FormData !== "undefined" && options.body instanceof FormData)
            ? options.body
            : JSON.stringify(options.body),
      });
    } catch (networkError) {
      if (timer) clearTimeout(timer);
      if (networkError.name === "AbortError") {
        const err = new Error("Request timed out. Please check your network connection and try again.");
        err.status = 408;
        throw err;
      }
      const err = new Error(networkError.message || "Network error. Unable to communicate with the server.");
      err.status = 0;
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); }
      catch { payload = { detail: "The server returned an invalid response." }; }
    }
    if (!response.ok) {
      const message = formatStatusError(response.status, payload?.detail);
      const error = new Error(message);
      error.status = response.status;
      error.detail = payload?.detail;
      throw error;
    }
    return payload;
  }

  global.CampusApi = Object.freeze({
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
    login: (email, password) => request("/api/v1/auth/login", { method: "POST", body: { email, password } }),
    logout: () => request("/api/v1/auth/logout", { method: "POST" }),
    session: () => request("/api/v1/auth/me"),
    registerStudent: (data) => request("/api/v1/auth/register/student", { method: "POST", body: data }),
    registerFaculty: (data) => request("/api/v1/auth/register/faculty", { method: "POST", body: data }),
    getBranches: () => request("/api/v1/branches"),
    formatError: formatStatusError,
  });
})(globalThis);
