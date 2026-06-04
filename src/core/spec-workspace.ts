const fs = require('node:fs');
const path = require('node:path');

export interface SpecWorkspaceBootstrapResult {
  specRoot: string;
  projectCreated: boolean;
  initializedBy: 'ome-spec' | 'skipped';
  message: string;
}

function writeFileIfNeeded(filePath: string, content: string, force: boolean): boolean {
  if (!force && fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  return true;
}

export function initializeSpecWorkspace(
  projectRoot: string,
  specRoot: string,
  force: boolean = false,
  enabled: boolean = true
): SpecWorkspaceBootstrapResult {
  if (!enabled) {
    return {
      specRoot,
      projectCreated: false,
      initializedBy: 'skipped',
      message: 'Spec workspace initialization skipped.'
    };
  }

  const root = path.join(projectRoot, specRoot);
  fs.mkdirSync(path.join(root, 'changes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'archive'), { recursive: true });

  const projectCreated = writeFileIfNeeded(
    path.join(root, 'project.md'),
    [
      '# OME Spec Project',
      '',
      'This workspace is managed by Oh My Engine.',
      'Use it for durable capability specs, active changes, and spec workflow context.'
    ].join('\n'),
    force
  );

  return {
    specRoot,
    projectCreated,
    initializedBy: 'ome-spec',
    message: 'OME spec workspace initialized.'
  };
}
