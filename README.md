# stratops

[![Test](https://github.com/Mind-Sports-Games/stratops/workflows/Test/badge.svg)](https://github.com/Mind-Sports-Games/stratops/actions)

Strategy games and strategy game variant rules and operations in TypeScript.

based on chessops: https://github.com/niklasf/chessops/

## Development

### Install build dependencies

```sh
pnpm install
```

### Update deps based on package.json file

```sh
rm -rf node_modules pnpm-lock.yaml && pnpm store prune && pnpm install
```

### Compile typescript

```sh
pnpm run prepare --watch
```

### Run tests

```sh
pnpm run test --watch
pnpm run test src/squareSet --watch
```

### Before committing

```sh
pnpm run lint
pnpm run format
```

### Watch changes from another project (link)

#### In the other project (e.g. lila)

- declare the link towards stratops (from project's `package.json`)

```json
"dependencies": {
  ...
  "stratops": "link:/path/to/stratops",
  ...
}
```

#### in stratops

- create `.env.local` file based on .env.local.default
- link back:

```sh
pnpm run link
```

- trigger compilation (no watch mode):

```sh
pnpm run prepare
```

## License

stratops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE.txt for details.
