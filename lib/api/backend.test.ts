import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendFetch, buildBackendUrl, getApiBaseUrl } from "@/lib/api/backend";
import { BackendRequestError } from "@/lib/api/errors";

describe("generic backend client", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.example.test/";
  });

  it("builds credentialed backend URLs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(getApiBaseUrl()).toBe("https://backend.example.test");
    expect(buildBackendUrl("/customers")).toBe(
      "https://backend.example.test/customers",
    );

    await expect(backendFetch("/customers")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example.test/customers",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("refreshes once on 401 and normalizes errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: "Unauthorized" }, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ id: "c1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      backendFetch("/customers/c1", { refreshOnUnauthorized: true }),
    ).resolves.toEqual({ id: "c1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: ["No válido"], statusCode: 400 }, { status: 400 }),
      ),
    );

    await expect(backendFetch("/customers")).rejects.toMatchObject({
      name: "BackendRequestError",
      message: "No válido",
      statusCode: 400,
    } satisfies Partial<BackendRequestError>);
  });
});
