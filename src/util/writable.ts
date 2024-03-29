export class WritableSet<T> extends Set<T> {
  toString (): string {
    return JSON.stringify(this.toJSON())
  }

  toJSON (): T[] {
    return Array.from(this)
  }
}

export class WriteableMap<V> extends Map<string, V> {
  toString (): string {
    return JSON.stringify(this.toJSON())
  }

  toJSON (): Record<string, V> {
    const json: { [key: string]: V } = {}
    for (const [key, value] of this.entries()) {
      json[key] = value
    }
    return json
  }

  static fromJS<T>(record: Record<string, T>): WriteableMap<T> {
    const map = new WriteableMap<T>()
    Object.entries(record).forEach(([key, value]) => {
      map.set(key, value)
    })
    return map
  }
}

export class WriteableRegExp extends RegExp {
  toJSON (): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.toString()
  }
}
