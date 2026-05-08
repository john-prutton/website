type Effect = () => void

let active: Effect | null = null

export class Signal<T> {
  #value: T
  #subs = new Set<Effect>()

  constructor(initial: T) {
    this.#value = initial
  }

  get value(): T {
    if (active) this.#subs.add(active)
    return this.#value
  }

  set value(next: T) {
    if (Object.is(this.#value, next)) return
    this.#value = next
    for (const sub of [...this.#subs]) sub()
  }
}

export function effect(fn: Effect): void {
  const run: Effect = () => {
    const prev = active
    active = run
    try {
      fn()
    } finally {
      active = prev
    }
  }
  run()
}
