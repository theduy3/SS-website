// @vitest-environment node
// Tests run in node env — getSupabaseAdmin() throws in jsdom (window defined).
// Matches the Plan 01 decision documented in 06-01-SUMMARY.md.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase module so getSupabaseAdmin can be controlled per-test.
vi.mock("@/lib/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase")>();
  return {
    ...actual,
    getSupabaseAdmin: vi.fn().mockReturnValue(null),
  };
});

// Lazy-import AFTER mocks are registered so the route module picks up mocks.
const { POST } = await import("./route");
const { getSupabaseAdmin } = await import("@/lib/supabase");

const TEST_SECRET = "test-shared-secret-xyz123";

/** Build a POST request to /api/dark-referral. */
function makePostRequest(opts: {
  secret?: string | null;
  body?: unknown;
  rawBody?: string;
}): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.secret != null) {
    headers["x-dark-referral-secret"] = opts.secret;
  }
  const body =
    opts.rawBody !== undefined
      ? opts.rawBody
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined;
  return new Request("http://localhost/api/dark-referral", {
    method: "POST",
    headers,
    body,
  });
}

const validBody = {
  ai_source: "chatgpt",
  referrer_host: "chatgpt.com",
  path: "/fr/about",
  utm_source: null,
};

describe("POST /api/dark-referral — secret guard (D-06)", () => {
  afterEach(() => {
    delete process.env.DARK_REFERRAL_SECRET;
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
  });

  it("returns ok (no-op, NOT 401) when DARK_REFERRAL_SECRET env var is absent (Pitfall 3)", async () => {
    delete process.env.DARK_REFERRAL_SECRET;
    const res = await POST(makePostRequest({ secret: TEST_SECRET, body: validBody }));
    expect(res.status).toBe(200);
    const json = await res.json() as Record<string, unknown>;
    expect(json.ok).toBe(true);
  });

  it("returns 401 when x-dark-referral-secret header does not match env secret", async () => {
    process.env.DARK_REFERRAL_SECRET = TEST_SECRET;
    const res = await POST(makePostRequest({ secret: "wrong-secret", body: {} }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when x-dark-referral-secret header is absent (secret IS configured in env)", async () => {
    process.env.DARK_REFERRAL_SECRET = TEST_SECRET;
    // No secret header → headers.get("x-dark-referral-secret") returns null → mismatch
    const res = await POST(makePostRequest({ secret: null, body: validBody }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/dark-referral — body parse", () => {
  beforeEach(() => {
    process.env.DARK_REFERRAL_SECRET = TEST_SECRET;
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
  });

  afterEach(() => {
    delete process.env.DARK_REFERRAL_SECRET;
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
  });

  it("returns 400 for non-JSON body with correct secret", async () => {
    const res = await POST(makePostRequest({ secret: TEST_SECRET, rawBody: "not-valid-json{{{{" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/dark-referral — Supabase write (D-05/D-09)", () => {
  beforeEach(() => {
    process.env.DARK_REFERRAL_SECRET = TEST_SECRET;
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
  });

  afterEach(() => {
    delete process.env.DARK_REFERRAL_SECRET;
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
  });

  it("returns ok (no-op) when Supabase is unconfigured (getSupabaseAdmin returns null)", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
    const res = await POST(makePostRequest({ secret: TEST_SECRET, body: validBody }));
    expect(res.status).toBe(200);
    const json = await res.json() as Record<string, unknown>;
    expect(json.ok).toBe(true);
  });

  it("inserts ONLY the 4 allowlisted fields — extra body fields dropped (D-09 invariant)", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as any);

    const bodyWithExtras = {
      ...validBody,
      ip: "192.168.1.1",          // must NOT reach DB
      user_agent: "ChatGPT/1.0",  // must NOT reach DB
      created_at: "2026-01-01",   // must NOT reach DB (DB-default — D-09)
    };

    const res = await POST(makePostRequest({ secret: TEST_SECRET, body: bodyWithExtras }));
    expect(res.status).toBe(200);

    // The route must have called db.from(DARK_REFERRALS_TABLE).insert(row)
    expect(mockFrom).toHaveBeenCalled();
    const insertedRow = mockInsert.mock.calls[0][0] as Record<string, unknown>;

    // Exactly 4 keys — no ip, no user_agent, no created_at
    expect(Object.keys(insertedRow).sort()).toEqual(["ai_source", "path", "referrer_host", "utm_source"]);
    expect(Object.keys(insertedRow)).toHaveLength(4);
    expect("ip" in insertedRow).toBe(false);
    expect("created_at" in insertedRow).toBe(false);
  });

  it("returns ok even when Supabase insert fails (best-effort logging, never crashes)", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: new Error("DB error") });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as any);

    const res = await POST(makePostRequest({ secret: TEST_SECRET, body: validBody }));
    expect(res.status).toBe(200);
  });
});
