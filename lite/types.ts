export type AnyObject<T = any> = Record<string, T>

export type AnyFn<R = any> = (...args: any[]) => R

export type MaybePromise<T = any> = T | Promise<T>

export type Unwrap<T> = T extends Promise<infer R> ? R : T

export type Use<T extends AnyFn<MaybePromise>> = Unwrap<ReturnType<T>>
