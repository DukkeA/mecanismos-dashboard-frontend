import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authFetch,
  buildBackendAuthUrl,
  getApiBaseUrl,
  sanitizeNextPath,
} from "@/lib/auth/backend";
import { AuthRequestError } from "@/lib/auth/types";

describe("direct backend auth helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test/";
  });

  it("uses the browser-safe API base URL", () => {
    expect(getApiBaseUrl()).toBe("https://backend.example.test");
    expect(buildBackendAuthUrl("/auth/me")).toBe(
      "https://backend.example.test/auth/me",
    );
  });

  it("sanitizes client next paths to avoid open redirects and refresh loops", () => {
    expect(sanitizeNextPath("/dashboard?tab=orders")).toBe("/dashboard?tab=orders");
    expect(sanitizeNextPath("https://evil.example/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.example/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/auth/refresh?next=/dashboard")).toBe("/dashboard");
  });

  it("calls the external backend with included credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "u1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authFetch<{ id: string }>("/auth/me")).resolves.toEqual({ id: "u1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.test/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("refreshes once on current-user 401 and retries the original request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: "Unauthorized" }, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ id: "u1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      authFetch<{ id: string }>("/auth/me", { refreshOnUnauthorized: true }),
    ).resolves.toEqual({ id: "u1" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://backend.example.test/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("normalizes backend auth errors without refreshing login failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: ["No session"], statusCode: 401 }, { status: 401 }),
      ),
    );

    await expect(authFetch("/auth/login", { method: "POST" })).rejects.toMatchObject({
      name: "AuthRequestError",
      message: "No session",
      statusCode: 401,
    } satisfies Partial<AuthRequestError>);
  });
});
