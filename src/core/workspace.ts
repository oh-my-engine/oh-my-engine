const fs = require('node:fs');
const path = require('node:path');
const { initializeProject } = require('./init');

/**
 * 递归搜索包含 .ome 目录的项目根路径
 */
function findOmeProjects(dir: string, depth: number = 0, maxDepth: number = 3): string[] {
  const projects: string[] = [];
  
  if (depth > maxDepth) return projects;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    const isProject = entries.some((e: any) => e.isDirectory() && e.name === '.ome') || 
                      entries.some((e: any) => e.isFile() && e.name === 'OME.md');
    
    if (isProject) {
      projects.push(dir);
      return projects;
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const fullPath = path.join(dir, entry.name);
        projects.push(...findOmeProjects(fullPath, depth + 1, maxDepth));
      }
    }
  } catch (error) {
    // Ignore
  }

  return projects;
}

/**
 * 批量更新工作区内的所有项目
 */
function updateWorkspace(root: string, options: any = {}): any[] {
  const projects = findOmeProjects(root);
  const results = [];
  
  // 核心：计算引擎自身的根目录，这是初始化逻辑需要的
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');

  for (const projectPath of projects) {
    try {
      const result = initializeProject({
        projectRoot: projectPath,
        repoRoot: repoRoot, // 注入必要的 repoRoot
        force: options.force || false,
        sync: true,
        installAgents: false,
        template: 'default'
      });
      results.push({ path: projectPath, success: true, result });
    } catch (error: any) {
      results.push({ path: projectPath, success: false, error: error?.message || String(error) });
    }
  }

  return results;
}

module.exports = {
  findOmeProjects,
  updateWorkspace
};
