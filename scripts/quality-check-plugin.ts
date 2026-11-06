import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

/**
 * 在 Vite 产出任何文件前执行根工作区质量检查，避免单独运行包构建时绕过统一校验。
 * 使用同步子进程是为了让格式或 Lint 错误直接阻断当前构建，而不是仅显示开发期提示。
 */
export const qualityCheckPlugin = (): Plugin => ({
  name: 'shushi-quality-check',
  apply: 'build',
  enforce: 'pre',
  buildStart: () => {
    const result = spawnSync(npmCommand, ['run', 'quality:check'], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    })

    if (result.error) {
      throw new Error(`[shushi-quality-check] 无法执行质量检查：${result.error.message}`)
    }

    if (result.status !== 0) {
      throw new Error('[shushi-quality-check] 格式或 Lint 检查失败，已中止构建。')
    }
  },
})
