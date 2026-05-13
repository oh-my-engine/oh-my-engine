const fs = require('node:fs');
const path = require('node:path');
const { initializeProject } = require('./init');

/**
 * 递归搜索包含 .ome 目录的项目根路径
 */
function findOmeProjects(dir: string, depth: number = 0, maxDepth: number = 5): string[] {
  const projects: string[] = [];
  
  // 基础限制，避免扫描过深
  if (depth > maxDepth) return projects;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    // 检查当前目录是否是 OME 项目
    const isProject = entries.some((e: any) => e.isDirectory() && e.name === '.ome') || 
                      entries.some((e: any) => e.isFile() && e.name === 'OME.md');
    
    if (isProject) {
      projects.push(dir);
      return projects;
    }

    // 递归扫描子目录
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const name = entry.name;
        // 跳过隐藏目录、node_modules 以及常见的构建输出目录
        if (name.startsWith('.') || 
            name === 'node_modules' || 
            name === 'dist' || 
            name === 'build' || 
            name === 'out' || 
            name === 'target') {
          continue;
        }
        
        const fullPath = path.join(dir, name);
        projects.push(...findOmeProjects(fullPath, depth + 1, maxDepth));
      }
    }
  } catch (error) {
    // 忽略权限错误
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
