import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync
} from 'fs';
import { execFileSync } from 'child_process';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const packageName = 'Style Sniffer 本地工具-mac-arm64';
const packageDir = join(distDir, packageName);
const zipPath = join(distDir, `${packageName}.zip`);
const appDir = join(packageDir, 'app');
const runtimeDir = join(packageDir, 'runtime');
const browsersDir = join(packageDir, 'ms-playwright');

const nodeBinary = process.env.NODE_BINARY || process.execPath;
const browserSource = process.env.PLAYWRIGHT_BROWSERS_PATH
  || join(homedir(), 'Library', 'Caches', 'ms-playwright');

if (!existsSync(nodeBinary)) {
  throw new Error(`找不到 Node 运行文件：${nodeBinary}`);
}

if (!existsSync(browserSource)) {
  throw new Error(`找不到 Playwright 浏览器内核：${browserSource}`);
}

rmSync(packageDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(appDir, { recursive: true });
mkdirSync(runtimeDir, { recursive: true });

copyProjectFiles();
cpSync(nodeBinary, join(runtimeDir, 'node'));
chmodSync(join(runtimeDir, 'node'), 0o755);
cpSync(browserSource, browsersDir, { recursive: true });

writeFileSync(join(packageDir, '启动 Style Sniffer.command'), launcherScript(), 'utf8');
chmodSync(join(packageDir, '启动 Style Sniffer.command'), 0o755);

writeFileSync(join(packageDir, '先看这里.txt'), userReadme(), 'utf8');

try {
  execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', packageDir, zipPath], {
    stdio: 'inherit'
  });
} catch (error) {
  console.warn('压缩 zip 失败，但免安装工具包文件夹已经生成。');
}

console.log('\n已生成免安装本地工具包：');
console.log(packageDir);
if (existsSync(zipPath)) {
  console.log('\n已生成可发送的压缩包：');
  console.log(zipPath);
}
console.log('\n普通用户只需要解压后双击：启动 Style Sniffer.command\n');

function copyProjectFiles() {
  const entries = [
    'bin',
    'lib',
    'web',
    'node_modules',
    'package.json',
    'package-lock.json',
    'README.zh-CN.md',
    'QUICKSTART.zh-CN.md',
    'LOCAL_RUN_FOR_BEGINNERS.zh-CN.md',
    'PORTABLE_PACKAGE.zh-CN.md'
  ];

  for (const entry of entries) {
    const source = join(rootDir, entry);
    if (!existsSync(source)) continue;
    const target = join(appDir, entry);
    cpSync(source, target, {
      recursive: true,
      filter: (sourcePath) => {
        const relative = sourcePath.replace(rootDir, '');
        if (relative.includes('/web/snapshots/')) return false;
        if (basename(sourcePath) === '.DS_Store') return false;
        return true;
      }
    });
  }

  mkdirSync(join(appDir, 'web', 'snapshots'), { recursive: true });
}

function launcherScript() {
  return `#!/bin/bash
cd "$(dirname "$0")"

export HOST="127.0.0.1"
export PORT="3000"
export PORT_ATTEMPTS="1"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/ms-playwright"

echo ""
echo "Style Sniffer 正在启动..."
echo "如果浏览器没有自动打开，请手动打开：http://127.0.0.1:3000"
echo ""

(sleep 2; open "http://127.0.0.1:3000") &
"$PWD/runtime/node" "$PWD/app/bin/cli.js" web

echo ""
echo "窗口关闭后，Style Sniffer 就停止运行。"
read -n 1 -s -r -p "按任意键关闭窗口"
`;
}

function userReadme() {
  return `Style Sniffer 本地工具

怎么用：

1. 双击「启动 Style Sniffer.command」
2. 等浏览器自动打开
3. 如果浏览器没有自动打开，就手动打开：
   http://127.0.0.1:3000

用完以后：

关闭终端窗口即可。

如果 Mac 提示不能打开：

按住 control 键点击「启动 Style Sniffer.command」，选择「打开」。

这个工具包已经自带运行环境，不需要另外安装任何东西。
`;
}
