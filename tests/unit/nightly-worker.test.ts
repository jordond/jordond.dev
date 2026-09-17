import { afterEach, expect, test, vi } from "vitest"
import worker from "../../workers/nightly/src/index"

const env = { GITHUB_TOKEN: "test-token" }

afterEach(() => {
  vi.unstubAllGlobals()
})

test("dispatches the deploy workflow on main", async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
  vi.stubGlobal("fetch", fetchMock)

  await worker.scheduled(undefined, env)

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ]
  expect(url).toBe(
    "https://api.github.com/repos/jordond/jordond.dev/actions/workflows/deploy.yml/dispatches",
  )
  expect(init.method).toBe("POST")
  expect(init.headers).toMatchObject({
    Authorization: "Bearer test-token",
    Accept: "application/vnd.github+json",
  })
  expect(JSON.parse(String(init.body))).toEqual({ ref: "main" })
})

test("throws when GitHub rejects the dispatch", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("Bad credentials", { status: 401 })),
  )

  await expect(worker.scheduled(undefined, env)).rejects.toThrow(
    /401 Bad credentials/,
  )
})
