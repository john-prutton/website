---
title: "Effect: Dependency injection in TypeScript"
blurp: My favourite way to use dependency injection in TS is also the simplest
pubDate: 2026-07-13
tags: ["tech"]
---

Writing tests should be a priority for you or your agent. Making the process
simple and frictionless is a good way to encourage you to write them, and
will save you time and tokens along the way.

Consider the code below. A simple utility function to check that a token
matches a user has leaked a dependency into the business logic.

```ts
// utilities/ensure-session-token-is-valid.ts
import { db, userTable, sessionTable, eq } from "@/db"

export async function ensureSessionTokenIsValid({
  username,
  token,
}: {
  username: string
  token: string
}) {
  const results = await db
    .select({ username: userTable.username })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.userId))
    .where(eq(sessionTable.token, token))

  const user = results.at(0)

  if (!user) throw new Error("Invalid token")

  if (user.username !== username)
    throw new Error("Username differs from token's username")
}
```

This results in a complicated testing process in which we end up having to mock
the database import and jump through a bunch of hoops.

```ts
// utilities/ensure-session-token-is-valid.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ensureSessionTokenIsValid } from "./ensure-session-token-is-valid"
import { db } from "@/db"

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn(),
    })),
  },
  userTable: {},
  sessionTable: {},
  eq: vi.fn(),
}))

function mockQueryResult(result: unknown[]) {
  ;(db.select as any).mockReturnValue({
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  })
}

describe("ensureSessionTokenIsValid", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resolves when the token is valid and username matches", async () => {
    mockQueryResult([{ username: "alice" }])

    await expect(
      ensureSessionTokenIsValid({ username: "alice", token: "valid-token" }),
    ).resolves.toBeUndefined()
  })

  it("throws when the token does not match any session", async () => {
    mockQueryResult([])

    await expect(
      ensureSessionTokenIsValid({ username: "alice", token: "bad-token" }),
    ).rejects.toThrow("Invalid token")
  })

  it("throws when the username does not match the token's user", async () => {
    mockQueryResult([{ username: "bob" }])

    await expect(
      ensureSessionTokenIsValid({ username: "alice", token: "valid-token" }),
    ).rejects.toThrow("Username differs from token's username")
  })
})
```

Now, compare this to the Effect code below. Notice how all imports point to
pure domain services/functions and Effect. I treat Effect as a superset of
TypeScript and consider this a language import. But other than this, there
aren't any third-party packages being imported and dirtying the business
logic.

```ts
// utilities/ensure-session-token-is-valid.ts
import * as Effect from "effect/Effect"

import { Db } from "@/domain/services/db"

const ensureSessionTokenIsValid = ({
  username,
  token,
}: {
  username: string
  token: string
}) =>
  Effect.gen(function* () {
    const db = yield* Db

    const session = yield* db.sessions.getByToken(token)
    if (!session) return yield* new SessionNotFoundError({ token })

    const user = yield* db.users.getById(session.userId)
    if (user.username !== username)
      return yield* new UserImpersonationError({
        token,
        username: user.username,
        allegedUsername: username,
      })
  })
```

`Db` is an Effect service, defined with `Context.Tag`:

```ts
// domain/services/db.ts
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"

export class Db extends Context.Tag("Db")<
  Db,
  {
    users: { getById: (id: string) => Effect.Effect<User | undefined> }
    sessions: {
      getByToken: (token: string) => Effect.Effect<Session | undefined>
    }
  }
>() {}
```

Services and layers are a big topic. I'll cover them properly in a future post:
[Effect: Services and Layers](/blog/effect-services-layers).

Now look at the tests.

```ts
// utilities/ensure-session-token-is-valid.test.ts
import { describe, expect, layer } from "@effect/vitest"
import * as Layer from "effect/Layer"
import * as Result from "effect/Result"

import { Db } from "@/domain/services/db"
import { ensureSessionTokenIsValid } from "@/domain/utilities"

const FakeDb = Layer.mock(Db, {
  users: {
    getById: (userId) =>
      userId === "real-user-id"
        ? Effect.succeed({ username: "real-user", id: "real-user-id" })
        : Effect.succeed(undefined),
  },
  sessions: {
    getByToken: (token) =>
      token === "real-token"
        ? Effect.succeed({ token: "real-token", userId: "real-user-id" })
        : Effect.succeed(undefined),
  },
})
const TestRunner = layer(FakeDb)

describe("ensureSessionTokenIsValid", () =>
  TestRunner((it) => {
    it.effect("resolves when the token is valid and username matches", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          ensureSessionTokenIsValid({
            username: "real-user",
            token: "real-token",
          }),
        )

        if (Result.isFailure(result)) expect.fail("test should pass")
      }),
    )

    it.effect("throws when the token does not match any session", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          ensureSessionTokenIsValid({
            username: "fake-username",
            token: "even-faker-token",
          }),
        )

        if (
          Result.isSuccess(result) ||
          result.failure._tag !== "SessionNotFoundError"
        )
          expect.fail("test should fail with SessionNotFoundError")
      }),
    )

    it.effect("throws when the username does not match the token's user", () =>
      Effect.gen(function* () {
        const result = yield* Effect.result(
          ensureSessionTokenIsValid({
            username: "fake-username",
            token: "real-token",
          }),
        )

        if (
          Result.isSuccess(result) ||
          result.failure._tag !== "UserImpersonationError"
        )
          expect.fail("test should fail with UserImpersonationError")
      }),
    )
  }))
```

The Effect version is more verbose, but easier to reason about, with rigidly
mocked services and type-safe errors. For how the real `Db` layer gets wired
up and provided in production, see [Effect: Services and Layers](/blog/effect-services-layers).
