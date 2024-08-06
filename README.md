# stratops

[![Test](https://github.com/Mind-Sports-Games/stratops/workflows/Test/badge.svg)](https://github.com/Mind-Sports-Games/stratops/actions)

Strategy games and strategy game variant rules and operations in TypeScript.

based on chessops: https://github.com/niklasf/chessops/

## Development

Install build dependencies:

```sh
pnpm install
```

Update deps:

```sh
rm -rf node_modules pnpm-lock.yaml && pnpm store prune && pnpm install
```

To compile typescript:

```sh
pnpm prepare --watch
```

run tests:

```sh
pnpm run test --watch
pnpm run test src/squareSet --watch
```

Before committing:

```sh
pnpm run lint
pnpm run format
```

## License

stratops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE.txt for details.
