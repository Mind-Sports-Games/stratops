import * as br from '@badrap/result';

export const zip = <T>(a: T[], b: T[]): Array<[T, T]> => a.map((k, i) => [k, b[i]]);

export type Option<A> = A | undefined | null;
export const Option = {
  isSome: <A>(a: Option<A>): a is A => a !== undefined && a !== null,
  isNone: <A>(a: Option<A>): a is undefined | null => a === undefined || a === null,
  map: <A, B>(f: (a: A) => B) => Option.flatMap<A, B>(a => f(a)),
  unwrap: <A>(a: Option<A>): A => {
    if (Option.isNone(a)) {
      throw new Error('panic!');
    } else {
      return a;
    }
  },
  fold: <A, B>(f: (a: A) => B, def: () => B) =>
    function (a: Option<A>): B {
      return Option.isSome(a) ? f(a) : def();
    },
  unwrapOr: <A>(def: A) =>
    function (a: Option<A>): A {
      return Option.isSome(a) ? a : def;
    },
  flatMap:
    <A, B>(f: (a: A) => Option<B>) =>
    (a: Option<A>): Option<B> =>
      Option.isSome(a) ? f(a) : undefined,
  flatMapErr:
    <A, B, Err extends Error>(f: (a: A) => br.Result<B, Err>, err: () => Err) =>
    (a: Option<A>): br.Result<B, Err> =>
      Option.isSome(a) ? f(a) : br.Result.err(err()),
  zip: <A, B>(a: Option<A>, b: Option<B>): Option<[A, B]> => {
    if (Option.isSome(a) && Option.isSome(b)) {
      return [a, b];
    }
    return undefined;
  },
  zipArray: <A>(array: Option<A>[]): Option<A[]> => (array.some(Option.isNone) ? undefined : (array as Option<A[]>)),
  zipTuple: <A, B>([a, b]: [Option<A>, Option<B>]): Option<[A, B]> => Option.zip(a, b),
  toResult:
    <A, E extends Error>(err: () => E) =>
    (a: Option<A>): br.Result<A, E> =>
      Option.isSome(a) ? br.Result.ok(a) : br.Result.err(err()),
  toResultOption:
    <A, E extends Error>(err: () => E) =>
    (a: Option<A>): br.Result<Option<A>, E> =>
      Option.isSome(a) ? br.Result.ok(a) : br.Result.err(err()),
  filter:
    <A>(f: (a: A) => boolean) =>
    (a: Option<A>) =>
      Option.isSome(a) && f(a) ? a : undefined,
};

//-----------------------------------------------------------------------------
export const Debug = {
  pp:
    (s: string) =>
    <A>(a: A): A => {
      console.log(`${s}: ${JSON.stringify(a)}`);
      return a;
    },
};

//-----------------------------------------------------------------------------
// TODO: make a more generalized version of this
export const Tuple = {
  map:
    <A, B>(f: (a: A) => B) =>
    ([a, b]: [A, A]): [B, B] =>
      [f(a), f(b)],
};

//-----------------------------------------------------------------------------
export function resultZip<A, Err extends Error>([a]: readonly [br.Result<A, Err>]): br.Result<[A], Err>;
export function resultZip<A, B, Err extends Error>([a, b]: readonly [br.Result<A, Err>, br.Result<B, Err>]): br.Result<
  [A, B],
  Err
>;
export function resultZip<A, B, C, Err extends Error>([a, b, c]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>
]): br.Result<[A, B, C], Err>;
export function resultZip<A, B, C, D, Err extends Error>([a, b, c, d]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>
]): br.Result<[A, B, C, D], Err>;
export function resultZip<A, B, C, D, E, Err extends Error>([a, b, c, d, e]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>,
  br.Result<E, Err>
]): br.Result<[A, B, C, D, E], Err>;
export function resultZip<A, B, C, D, E, F, Err extends Error>([a, b, c, d, e, f]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>,
  br.Result<E, Err>,
  br.Result<F, Err>
]): br.Result<[A, B, C, D, E, F], Err>;
export function resultZip<A, B, C, D, E, F, G, Err extends Error>([a, b, c, d, e, f, g]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>,
  br.Result<E, Err>,
  br.Result<F, Err>,
  br.Result<G, Err>
]): br.Result<[A, B, C, D, E, F, G], Err>;
export function resultZip<A, B, C, D, E, F, G, H, Err extends Error>([a, b, c, d, e, f, g, h]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>,
  br.Result<E, Err>,
  br.Result<F, Err>,
  br.Result<G, Err>,
  br.Result<H, Err>
]): br.Result<[A, B, C, D, E, F, G, H], Err>;
export function resultZip<A, B, C, D, E, F, G, H, I, Err extends Error>([a, b, c, d, e, f, g, h, i]: readonly [
  br.Result<A, Err>,
  br.Result<B, Err>,
  br.Result<C, Err>,
  br.Result<D, Err>,
  br.Result<E, Err>,
  br.Result<F, Err>,
  br.Result<G, Err>,
  br.Result<H, Err>,
  br.Result<I, Err>
]): br.Result<[A, B, C, D, E, F, G, H, I], Err>;
export function resultZip<Err extends Error>([a, b, c, d, e, f, g, h, i]: readonly [
  br.Result<unknown, Err>,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?,
  br.Result<unknown, Err>?
]): unknown {
  const args = [a, b, c, d, e, f, g, h, i].filter(Option.isSome) as br.Result<unknown, Err>[];
  switch (args.length) {
    case 1:
      return a.map(a => [a]);
    case 2:
      return a.chain(a => b!.map(b => [a, b]));
    case 3:
      return a.chain(a => b!.chain(b => c!.map(c => [a, b, c])));
    case 4:
      return a.chain(a => b!.chain(b => c!.chain(c => d!.map(d => [a, b, c, d]))));
    case 5:
      return a.chain(a => b!.chain(b => c!.chain(c => d!.chain(d => e!.map(e => [a, b, c, d, e])))));
    case 6:
      return a.chain(a => b!.chain(b => c!.chain(c => d!.chain(d => e!.chain(e => f!.map(f => [a, b, c, d, e, f]))))));
    case 7:
      return a.chain(a =>
        b!.chain(b => c!.chain(c => d!.chain(d => e!.chain(e => f!.chain(f => g!.map(g => [a, b, c, d, e, f, g]))))))
      );
    case 8:
      return a.chain(a =>
        b!.chain(b =>
          c!.chain(c =>
            d!.chain(d => e!.chain(e => f!.chain(f => g!.chain(g => h!.map(h => [a, b, c, d, e, f, g, h])))))
          )
        )
      );
    default:
      return a.chain(a =>
        b!.chain(b =>
          c!.chain(c =>
            d!.chain(d =>
              e!.chain(e => f!.chain(f => g!.chain(g => h!.chain(h => i!.map(i => [a, b, c, d, e, f, g, h, i])))))
            )
          )
        )
      );
  }
}

export const Result = {
  zip: resultZip,
  map:
    <A, B, Err extends Error>(f: (a: A) => B) =>
    (result: br.Result<A, Err>): br.Result<B, Err> =>
      result.map(f),
  flatMap:
    <A, B, Err extends Error>(f: (a: A) => br.Result<B, Err>) =>
    (result: br.Result<A, Err>): br.Result<B, Err> =>
      result.chain(f),
  validate:
    <A, Err extends Error>(f: (a: A) => boolean, err: () => Err) =>
    (result: br.Result<A, Err>): br.Result<A, Err> =>
      result.chain(a => (f(a) ? br.Result.ok(a) : br.Result.err(err()))),
  unwrapOr:
    <A>(def: A) =>
    <Err extends Error>(result: br.Result<A, Err>): A => {
      return result.unwrap(
        v => v,
        _ => def
      );
    },
};

//-----------------------------------------------------------------------------
// Taken from:
// https://github.com/gcanti/fp-ts/blob/master/src/function.ts#L396C1-L689C2

/**
 * Pipes the value of an expression into a pipeline of functions.
 *
 * See also [`flow`](#flow).
 *
 * @example
 * import { pipe } from 'fp-ts/function'
 *
 * const len = (s: string): number => s.length
 * const double = (n: number): number => n * 2
 *
 * // without pipe
 * assert.strictEqual(double(len('aaa')), 6)
 *
 * // with pipe
 * assert.strictEqual(pipe('aaa', len, double), 6)
 *
 * @since 2.6.3
 */
export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F
): F;
export function pipe<A, B, C, D, E, F, G>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G
): G;
export function pipe<A, B, C, D, E, F, G, H>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I
): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J
): J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K
): K;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L
): L;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M
): M;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N
): N;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O
): O;

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P
): P;

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q
): Q;

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R
): R;

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R,
  rs: (r: R) => S
): S;

export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R,
  rs: (r: R) => S,
  st: (s: S) => T
): T;
export function pipe(
  a: unknown,
  ab?: Function,
  bc?: Function,
  cd?: Function,
  de?: Function,
  ef?: Function,
  fg?: Function,
  gh?: Function,
  hi?: Function
): unknown {
  switch (arguments.length) {
    case 1:
      return a;
    case 2:
      return ab!(a);
    case 3:
      return bc!(ab!(a));
    case 4:
      return cd!(bc!(ab!(a)));
    case 5:
      return de!(cd!(bc!(ab!(a))));
    case 6:
      return ef!(de!(cd!(bc!(ab!(a)))));
    case 7:
      return fg!(ef!(de!(cd!(bc!(ab!(a))))));
    case 8:
      return gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))));
    case 9:
      return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))));
    default: {
      let ret = arguments[0];
      for (let i = 1; i < arguments.length; i++) {
        ret = arguments[i](ret);
      }
      return ret;
    }
  }
}
