---
title: "Effect: TypeScript the way it should be"
blurp: A year of Effect in production and I'm not going back
pubDate: 2026-07-13
tags: ["tech"]
---

I've been running Effect in production for over a year. It's stayed.

The pitch: typed errors, dependency injection, and composable scheduling for
retries. TypeScript gives you none of these out of the box. Effect gives you
all three, and they compose naturally.

## Typed errors

In plain TypeScript, a function that can fail either throws or returns a union
like `T | Error`. Both are leaky: throws aren't in the type signature, and
returned errors are easy to ignore.

Effect tracks errors in the type itself. An
`Effect<User, DatabaseError | NotFoundError>` tells you exactly what can go wrong.

```typescript
class DatabaseError {
  readonly _tag = "DatabaseError"
  constructor(readonly message: string) {}
}

class NotFoundError {
  readonly _tag = "NotFoundError"
  constructor(readonly id: string) {}
}

const getUser = (id: string): Effect.Effect<User, DatabaseError | NotFoundError> =>
  Effect.gen(function* () {
    const row = yield* Effect.tryPromise({
      try: () => db.query(id),
      catch: (e) => new DatabaseError(String(e)),
    })
    if (!row) return yield* Effect.fail(new NotFoundError(id))
    return row
  })
```

If you try to use the result without handling both error cases, it won't compile.

## Dependency injection

Effect's DI is built around `Context` and `Layer`. You define a service as a
tag, implement it, and provide the implementation at the edge of your program.

```typescript
class Database extends Context.Tag("Database")<
  Database,
  { findUser: (id: string) => Effect.Effect<User | null, DatabaseError> }
>() {}
```

In production you provide a real implementation. In tests you swap it out:

```typescript
const DatabaseLive = Layer.succeed(Database, {
  findUser: (id) => Effect.tryPromise({ ... })
})

const DatabaseTest = Layer.succeed(Database, {
  findUser: () => Effect.succeed({ id: "1", name: "Test User" })
})
```

No mocking libraries. No global state to clean up. The test implementation
is just data.

## Retries

Most retry logic is boilerplate. With Effect it's a one-liner built from a schedule:

```typescript
const resilient = getUser("123").pipe(
  Effect.retry(
    Schedule.exponential("100 millis").pipe(Schedule.compose(Schedule.recurs(3)))
  )
)
```

Exponential backoff, capped at 3 attempts. Throw in `Schedule.jittered` if
you're hitting a shared API and want to avoid thundering herd. Schedules
compose, so you can build exactly the behaviour you need.

---

The three features work together. A service defined with `Context.Tag` can
use `Effect.retry` internally, and the errors it surfaces are tracked at the
call site. Everything stays explicit.

There's a lot more to cover: streaming, interruption, fibers,
`@effect/platform` for HTTP. More posts coming.
