const { spawnSync } = require('node:child_process');
const { updateWorkspace } = require('./workspace');
const { initializeProject } = require('./init');
const fs = require('node:fs');
const path = require('node:path');

/**
 * 执行全局 npm 包更新
 */
function updateGlobalPackage(): void {
  console.log('🚀 正在从 npm 市场获取最新版本...');
  
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  
  const result = spawnSync(npmCmd, ['install', '-g', 'oh-my-engine'], {
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error('npm 更新失败，请检查网络或权限。');
  }

  console.log('✅ 全局工具已更新到最新版本。');
}

/**
 * 运行统一更新指令
 */
async function runUpdateCommand(args: string[] = []): Promise<void> {
  const isRecursive = args.includes('--all') || args.includes('-a');
  const isForce = args.includes('--force');
  
  // 核心：计算引擎自身的根目录
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');

  // 1. 首先尝试更新全局工具
  try {
    updateGlobalPackage();
  } catch (error: any) {
    console.error(`⚠️  CLI 工具更新跳过: ${error?.message || String(error)}`);
    console.log('继续尝试更新项目配置...\n');
  }

  // 2. 更新项目配置
  if (isRecursive) {
    console.log(`🔍 正在扫描工作区中的 OME 项目: ${process.cwd()}`);
    const results: any[] = updateWorkspace(process.cwd(), { force: isForce });
    
    console.log(`\n完成！共处理 ${results.length} 个项目:`);
    results.forEach((res: any) => {
      const status = res.success ? '✅' : '❌';
      const name = path.basename(res.path);
      console.log(`${status} ${name} (${res.path})`);
      if (!res.success) console.log(`   原因: ${res.error}`);
    });
  } else {
    // 检查当前是否在 OME 项目中
    const hasOme = fs.existsSync(path.join(process.cwd(), '.ome')) || 
                   fs.existsSync(path.join(process.cwd(), 'OME.md'));
    
    if (hasOme) {
      console.log('🔄 正在同步当前项目的 OME 配置...');
      initializeProject({
        projectRoot: process.cwd(),
        repoRoot: repoRoot, // 注入必要的 repoRoot
        force: isForce,
        sync: true
      });
      console.log('✅ 当前项目已同步。');
    } else {
      console.log('💡 当前目录不是 OME 项目。运行 `ome update --all` 可以批量更新子目录下的所有项目。');
    }
  }
}

module.exports = {
  runUpdateCommand
};
