#!/usr/bin/env node

/**
 * Migration script: JSON/JSONL → Markdown
 *
 * Converts existing memory data from JSON/JSONL format to Markdown format.
 *
 * Usage:
 *   node dist/scripts/migrate-memory-to-markdown.js [project-root]
 */

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

function enginePath(projectRoot: string, ...segments: string[]): string {
  return path.join(projectRoot, '.ome', ...segments);
}

function slugifyForFile(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
    .slice(0, 50);
}

function buildExecutionMarkdown(record: any): string {
  const frontmatter: any = {
    id: record.id,
    type: 'execution',
    workflow: record.workflow,
    phase: record.phase,
    timestamp: record.timestamp,
    status: record.status,
    duration: record.durationMs,
    captureLevel: record.captureLevel,
    changeId: record.changeId || undefined,
    changeSlug: record.changeSlug || undefined,
    capability: record.capability || undefined
  };

  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.summary || 'Execution Record'}\n\n`;

  content += `## Details\n\n`;
  content += `- **Workflow**: ${record.workflow}\n`;
  if (record.phase) content += `- **Phase**: ${record.phase}\n`;
  content += `- **Status**: ${record.status}\n`;
  content += `- **Duration**: ${record.durationMs}ms\n`;
  content += `- **Timestamp**: ${record.timestamp}\n\n`;

  if (record.whyStored) {
    content += `## Why Stored\n\n${record.whyStored}\n\n`;
  }

  if (record.errors && record.errors.length > 0) {
    content += `## Errors\n\n`;
    record.errors.forEach((error: string) => {
      content += `- ${error}\n`;
    });
    content += `\n`;
  }

  if (record.filesTouched && record.filesTouched.length > 0) {
    content += `## Files Touched\n\n`;
    record.filesTouched.forEach((file: string) => {
      content += `- ${file}\n`;
    });
    content += `\n`;
  }

  if (record.testsRun && record.testsRun.length > 0) {
    content += `## Tests Run\n\n`;
    record.testsRun.forEach((test: string) => {
      content += `- ${test}\n`;
    });
    content += `\n`;
  }

  if (record.metadata && Object.keys(record.metadata).length > 0) {
    content += `## Metadata\n\n`;
    content += '```json\n';
    content += JSON.stringify(record.metadata, null, 2);
    content += '\n```\n';
  }

  return matter.stringify(content, frontmatter);
}

function migrateExecutionRecords(projectRoot: string): number {
  const baseDir = enginePath(projectRoot, 'memory', 'executions');

  if (!fs.existsSync(baseDir)) {
    console.log('No execution records to migrate');
    return 0;
  }

  let count = 0;
  const workflows = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry: any) => entry.isDirectory());

  for (const workflow of workflows) {
    const workflowPath = path.join(baseDir, workflow.name);
    const files = fs.readdirSync(workflowPath, { withFileTypes: true })
      .filter((entry: any) => entry.isFile() && entry.name.endsWith('.jsonl'));

    for (const file of files) {
      const jsonlPath = path.join(workflowPath, file.name);
      const content = fs.readFileSync(jsonlPath, 'utf8');
      const lines = content.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const record = JSON.parse(line);
          const slug = slugifyForFile(record.summary || 'execution');
          const day = record.timestamp.slice(0, 10);
          const mdPath = path.join(workflowPath, `${day}-${slug}.md`);

          // Skip if already exists
          if (fs.existsSync(mdPath)) {
            console.log(`Skipping existing: ${mdPath}`);
            continue;
          }

          const markdown = buildExecutionMarkdown(record);
          fs.writeFileSync(mdPath, markdown, 'utf8');
          count++;
          console.log(`Migrated: ${mdPath}`);
        } catch (error) {
          console.error(`Failed to migrate record from ${jsonlPath}:`, error);
        }
      }

      // Backup original JSONL file
      const backupPath = jsonlPath.replace('.jsonl', '.jsonl.backup');
      fs.renameSync(jsonlPath, backupPath);
      console.log(`Backed up: ${backupPath}`);
    }
  }

  return count;
}

function migratePreferenceRecords(projectRoot: string): number {
  const baseDir = enginePath(projectRoot, 'memory', 'preferences');

  if (!fs.existsSync(baseDir)) {
    console.log('No preference records to migrate');
    return 0;
  }

  let count = 0;
  const files = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry: any) => entry.isFile() && entry.name.endsWith('.json'));

  for (const file of files) {
    const jsonPath = path.join(baseDir, file.name);

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const scope = data.scope || path.basename(file.name, '.json');

      if (!Array.isArray(data.records)) {
        console.warn(`Invalid preference file: ${jsonPath}`);
        continue;
      }

      for (const record of data.records) {
        const slug = slugifyForFile(record.statement);
        const mdPath = path.join(baseDir, `${scope}-${slug}.md`);

        // Skip if already exists
        if (fs.existsSync(mdPath)) {
          console.log(`Skipping existing: ${mdPath}`);
          continue;
        }

        const frontmatter: any = {
          id: record.id,
          type: 'preference',
          scope: record.scope,
          source: record.source,
          explicit: record.explicit,
          evidenceCount: record.evidenceCount,
          lastConfirmedAt: record.lastConfirmedAt,
          stability: record.stability,
          status: record.status
        };

        let content = `# ${record.statement}\n\n`;
        content += `## Details\n\n`;
        content += `- **Scope**: ${record.scope}\n`;
        content += `- **Source**: ${record.source}\n`;
        content += `- **Evidence Count**: ${record.evidenceCount}\n`;
        content += `- **Stability**: ${record.stability}\n`;
        content += `- **Status**: ${record.status}\n\n`;

        if (record.whyStored) {
          content += `## Why Stored\n\n${record.whyStored}\n\n`;
        }

        const markdown = matter.stringify(content, frontmatter);
        fs.writeFileSync(mdPath, markdown, 'utf8');
        count++;
        console.log(`Migrated: ${mdPath}`);
      }

      // Backup original JSON file
      const backupPath = jsonPath.replace('.json', '.json.backup');
      fs.renameSync(jsonPath, backupPath);
      console.log(`Backed up: ${backupPath}`);
    } catch (error) {
      console.error(`Failed to migrate ${jsonPath}:`, error);
    }
  }

  return count;
}

function migrateCandidates(projectRoot: string, type: 'learning' | 'skill'): number {
  const baseDir = type === 'learning'
    ? enginePath(projectRoot, 'memory', 'learnings', 'candidates')
    : enginePath(projectRoot, 'memory', 'skill-candidates');

  if (!fs.existsSync(baseDir)) {
    console.log(`No ${type} candidates to migrate`);
    return 0;
  }

  let count = 0;
  const files = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry: any) => entry.isFile() && entry.name.endsWith('.json'));

  for (const file of files) {
    const jsonPath = path.join(baseDir, file.name);
    const mdPath = jsonPath.replace('.json', '.md');

    // Skip if already exists
    if (fs.existsSync(mdPath)) {
      console.log(`Skipping existing: ${mdPath}`);
      continue;
    }

    try {
      const record = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      const frontmatter: any = type === 'learning' ? {
        id: record.id,
        type: 'learning',
        slug: record.slug,
        category: record.category,
        workflow: record.workflow,
        phase: record.phase,
        status: record.status,
        evidenceCount: record.evidenceCount,
        reusability: record.reusability,
        verification: record.verification
      } : {
        id: record.id,
        type: 'skill',
        slug: record.slug,
        patternCategory: record.patternCategory,
        patternId: record.patternId,
        status: record.status,
        evidenceCount: record.evidenceCount,
        verification: record.verification
      };

      let content = `# ${record.title}\n\n`;

      if (record.summary) {
        content += `## Summary\n\n${record.summary}\n\n`;
      }

      if (type === 'learning' && record.appliesTo && record.appliesTo.length > 0) {
        content += `## Applies To\n\n`;
        record.appliesTo.forEach((item: string) => {
          content += `- ${item}\n`;
        });
        content += `\n`;
      }

      if (record.evidence && record.evidence.length > 0) {
        content += `## Evidence\n\n`;
        record.evidence.forEach((ev: any) => {
          content += `### ${ev.timestamp || 'Evidence'}\n\n`;
          content += `- **Change ID**: ${ev.changeId || 'N/A'}\n`;
          content += `- **Workflow**: ${ev.workflow || 'N/A'}\n`;
          if (type === 'learning') content += `- **Phase**: ${ev.phase || 'N/A'}\n`;
          content += `- **Status**: ${ev.status || 'N/A'}\n\n`;
        });
      }

      if (record.whyStored) {
        content += `## Why Stored\n\n${record.whyStored}\n\n`;
      }

      const markdown = matter.stringify(content, frontmatter);
      fs.writeFileSync(mdPath, markdown, 'utf8');
      count++;
      console.log(`Migrated: ${mdPath}`);

      // Backup original JSON file
      const backupPath = jsonPath.replace('.json', '.json.backup');
      fs.renameSync(jsonPath, backupPath);
      console.log(`Backed up: ${backupPath}`);
    } catch (error) {
      console.error(`Failed to migrate ${jsonPath}:`, error);
    }
  }

  return count;
}

function main() {
  const projectRoot = process.argv[2] || process.cwd();

  console.log(`\n🔄 Migrating memory data to Markdown format...`);
  console.log(`Project root: ${projectRoot}\n`);

  let totalCount = 0;

  console.log('📝 Migrating execution records...');
  totalCount += migrateExecutionRecords(projectRoot);

  console.log('\n📝 Migrating preference records...');
  totalCount += migratePreferenceRecords(projectRoot);

  console.log('\n📝 Migrating learning candidates...');
  totalCount += migrateCandidates(projectRoot, 'learning');

  console.log('\n📝 Migrating skill candidates...');
  totalCount += migrateCandidates(projectRoot, 'skill');

  console.log(`\n✅ Migration complete! Migrated ${totalCount} records.`);
  console.log(`\n💡 Original JSON/JSONL files have been renamed to *.backup`);
  console.log(`   You can safely delete them after verifying the migration.\n`);
}

main();
