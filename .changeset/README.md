# Changesets

每个面向 `@u1in/shushi-core` 用户的改动都应新增一个 changeset 文件。

```bash
npm run changeset
```

准备发布时执行：

```bash
npm run release:version
npm run release:check
npx changeset publish
```

Changesets 会根据文件中的版本级别更新 `packages/core/package.json`，并生成或更新该包的 `CHANGELOG.md`。
