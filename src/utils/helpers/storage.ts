export type StorageDriver = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>

function safeParse<T>(value: string | null, fallback: T): T {
  if (value == null) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function createStore(namespace = 'app', driver: StorageDriver = localStorage) {
  const makeKey = (key: string) => `${namespace}:${key}`
  return {
    get<T>(key: string, fallback: T): T { return safeParse<T>(driver.getItem(makeKey(key)), fallback) },
    set<T>(key: string, value: T): void { try { driver.setItem(makeKey(key), JSON.stringify(value)) } catch {} },
    remove(key: string): void { try { driver.removeItem(makeKey(key)) } catch {} },
    clear(): void { try { driver.clear() } catch {} },
  }
}

export const localStore = createStore('app', typeof localStorage === 'undefined' ? ({} as any) : localStorage)
export const sessionStore = createStore('app', typeof sessionStorage === 'undefined' ? ({} as any) : sessionStorage)
