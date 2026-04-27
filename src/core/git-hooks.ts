const fs = require('node:fs');
const path = require('node:path');

export function installGitHooks(projectRoot: string): void {
  const hooksDir = path.join(projectRoot, '.git', 'hooks');

  if (!fs.existsSync(hooksDir)) {
    throw new Error('Not a git repository');
  }

  // 安装 post-commit hook
  const postCommitHook = `#!/bin/sh
# Oh My Engine - Auto record execution on commit

# 检查是否有活动会话
if [ -f ".ome/.session" ]; then
  echo "📝 Recording workflow execution..."
  ome finish --auto
fi
`;

  const postCommitPath = path.join(hooksDir, 'post-commit');

  // 检查是否已存在 hook
  if (fs.existsSync(postCommitPath)) {
    const existingContent = fs.readFileSync(postCommitPath, 'utf8');

    // 如果已经包含 OME 的 hook，跳过
    if (existingContent.includes('Oh My Engine')) {
      process.stdout.write('ℹ️  Git hooks already installed\n');
      return;
    }

    // 追加到现有 hook
    fs.appendFileSync(postCommitPath, '\n' + postCommitHook);
    process.stdout.write('✅ Git hooks appended to existing post-commit\n');
  } else {
    // 创建新的 hook
    fs.writeFileSync(postCommitPath, postCommitHook, { mode: 0o755 });
    process.stdout.write('✅ Git hooks installed\n');
  }
}

export function uninstallGitHooks(projectRoot: string): void {
  const postCommitPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');

  if (!fs.existsSync(postCommitPath)) {
    process.stdout.write('ℹ️  No git hooks to uninstall\n');
    return;
  }

  const content = fs.readFileSync(postCommitPath, 'utf8');

  // 移除 OME 相关的 hook
  const lines = content.split('\n');
  const filteredLines: string[] = [];
  let inOmeBlock = false;

  for (const line of lines) {
    if (line.includes('Oh My Engine')) {
      inOmeBlock = true;
      continue;
    }

    if (inOmeBlock && line.trim() === '') {
      inOmeBlock = false;
      continue;
    }

    if (!inOmeBlock) {
      filteredLines.push(line);
    }
  }

  const newContent = filteredLines.join('\n').trim();

  if (newContent === '#!/bin/sh' || newContent === '') {
    // 如果只剩下 shebang 或为空，删除文件
    fs.unlinkSync(postCommitPath);
    process.stdout.write('✅ Git hooks uninstalled (file removed)\n');
  } else {
    // 写回过滤后的内容
    fs.writeFileSync(postCommitPath, newContent + '\n', { mode: 0o755 });
    process.stdout.write('✅ Git hooks uninstalled (OME section removed)\n');
  }
}
