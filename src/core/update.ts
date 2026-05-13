const { spawnSync } = require('node:child_process');
const { updateWorkspace } = require('./workspace');
const { initializeProject } = require('./init');
const fs = require('node:fs');
const path = require('node:path');

function extractProcessFailure(result: {
  error?: NodeJS.ErrnoException | null;
  signal?: NodeJS.Signals | null;
  stderr?: string | Buffer | null;
  stdout?: string | Buffer | null;
}): string {
  if (result.error?.message) {
    return result.error.message;
  }

  if (result.signal) {
    return `npm process terminated by signal ${result.signal}`;
  }

  const stderr = typeof result.stderr === 'string'
    ? result.stderr.trim()
    : result.stderr?.toString('utf8').trim();
  if (stderr) {
    return stderr;
  }

  const stdout = typeof result.stdout === 'string'
    ? result.stdout.trim()
    : result.stdout?.toString('utf8').trim();
  if (stdout) {
    return stdout;
  }

  return 'unknown npm failure';
}

function updateGlobalPackage(): void {
  console.log('🚀 正在从 npm 市场获取最新版本...');

  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npm';
  const args = isWindows
    ? ['/c', 'npm.cmd', 'install', '-g', 'oh-my-engine']
    : ['install', '-g', 'oh-my-engine'];

  const result = spawnSync(command, args, {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const detail = extractProcessFailure(result);
    throw new Error(`npm 更新失败，请检查网络或权限。详细信息: ${detail}`);
  }

  console.log('✅ 全局工具已更新到最新版本。');
}

async function runUpdateCommand(args: string[] = []): Promise<void> {
  const isRecursive = args.includes('--all') || args.includes('-a');
  const isForce = args.includes('--force');
  const skipGlobalUpdate = args.includes('--project-only')
    || args.includes('--skip-global')
    || process.env.OME_SKIP_GLOBAL_UPDATE === '1';
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');

  if (!skipGlobalUpdate) {
    try {
      updateGlobalPackage();
    } catch (error: any) {
      console.error(`⚠️  CLI 工具更新跳过: ${error?.message || String(error)}`);
      console.log('继续尝试更新项目配置...\n');
    }
  } else {
    console.log('⏭️  已跳过全局 CLI 更新，仅同步项目配置。\n');
  }

  if (isRecursive) {
    console.log(`📦 正在扫描工作区中的 OME 项目: ${process.cwd()}`);
    const results: any[] = updateWorkspace(process.cwd(), { force: isForce });

    console.log(`\n完成！共处理 ${results.length} 个项目`);
    results.forEach((res: any) => {
      const status = res.success ? '✅' : '❌';
      const name = path.basename(res.path);
      console.log(`${status} ${name} (${res.path})`);
      if (!res.success) {
        console.log(`   原因: ${res.error}`);
      }
    });
    return;
  }

  const hasOme = fs.existsSync(path.join(process.cwd(), '.ome')) ||
    fs.existsSync(path.join(process.cwd(), 'OME.md'));

  if (!hasOme) {
    console.log('💡 当前目录不是 OME 项目。运行 `ome update --all` 可以批量更新子目录下的所有项目。');
    return;
  }

  console.log('🔄 正在同步当前项目的 OME 配置...');
  const result = initializeProject({
    projectRoot: process.cwd(),
    repoRoot,
    force: isForce,
    sync: true
  });
  console.log('✅ 当前项目已同步。');
  console.log(`   - Project skills updated: ${result.projectSkillTargets.length}`);
  console.log(`   - Project skill mirrors synced: ${result.projectSkillMirrorTargets.length}`);
  console.log(`   - Project command entries synced: ${result.projectPlatformTargets.length}`);
  console.log(`   - Rule integrations synced: ${result.syncedTargets.length}`);
  console.log(`   - Agent guidance files generated: ${result.agentGuidanceFiles.length}`);
  console.log(`   - Rule/context files updated: ${result.rulesUpdated + result.contextFilesUpdated}`);
}

module.exports = {
  runUpdateCommand
};
