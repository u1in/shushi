import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(projectRoot, 'packages/core/CHANGELOG.md')
const targetPath = resolve(projectRoot, 'packages/docs/更新日志.md')

// VuePress 只读取 packages/docs；构建前同步 npm 包的日志，避免维护两份手写内容。
// 更新日志是独立阅读页，不应继承文档站的分类侧边栏。
await mkdir(dirname(targetPath), { recursive: true })
const changelog = await readFile(sourcePath, 'utf8')
await writeFile(targetPath, `---\nsidebar: false\n---\n\n${changelog}`)
