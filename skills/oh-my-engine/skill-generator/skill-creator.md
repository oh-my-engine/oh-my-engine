---
name: skill-creator
version: 1.0.0
description: 生成新的 Skill
category: skill-generator
---

# Skill 创建器 (Skill Creator)

基于识别的模式，自动生成新的 Skill。

## 核心功能

### 1. 生成 Skill 定义

#### 1.1 错误修复 Skill
```javascript
function generateErrorFixSkill(pattern) {
  const skillName = `fix-${kebabCase(pattern.type)}`;
  
  return {
    name: skillName,
    version: '1.0.0',
    description: `自动修复 ${pattern.type} 错误`,
    category: 'error-fix',
    trigger: {
      condition: `error.type === "${pattern.type}"`,
      auto: true,
    },
    implementation: generateErrorFixImplementation(pattern),
    tests: generateErrorFixTests(pattern),
  };
}

function generateErrorFixImplementation(pattern) {
  return `
---
name: ${pattern.skillName}
version: 1.0.0
description: ${pattern.description}
---

# ${pattern.skillName}

自动修复 ${pattern.type} 错误。

## 错误模式

**触发条件**: ${pattern.pattern.trigger}
**错误症状**: ${pattern.pattern.symptom}
**根本原因**: ${pattern.pattern.rootCause}

## 解决方案

${pattern.pattern.solution}

## 实现

\`\`\`javascript
${generateFixCode(pattern)}
\`\`\`

## 使用示例

\`\`\`javascript
// 自动触发
try {
  await riskyOperation();
} catch (error) {
  if (error.type === '${pattern.type}') {
    await ${pattern.skillName}(error);
  }
}
\`\`\`
`;
}
```

#### 1.2 工具提取 Skill
```javascript
function generateToolExtractionSkill(pattern) {
  const skillName = `${kebabCase(pattern.name)}-helper`;
  
  return {
    name: skillName,
    version: '1.0.0',
    description: `${pattern.name} 工具函数`,
    category: 'utility',
    implementation: generateToolImplementation(pattern),
    tests: generateToolTests(pattern),
  };
}

function generateToolImplementation(pattern) {
  return `
---
name: ${pattern.skillName}
version: 1.0.0
description: ${pattern.description}
---

# ${pattern.skillName}

提取的通用工具函数。

## 功能

${pattern.functionality}

## 实现

\`\`\`javascript
${pattern.abstraction.code}
\`\`\`

## 参数

${generateParameterDocs(pattern.abstraction.parameters)}

## 返回值

${generateReturnDocs(pattern.abstraction.returns)}

## 使用示例

\`\`\`javascript
${generateUsageExamples(pattern)}
\`\`\`
`;
}
```

#### 1.3 最佳实践 Skill
```javascript
function generateBestPracticeSkill(pattern) {
  const skillName = `${kebabCase(pattern.name)}-best-practice`;
  
  return {
    name: skillName,
    version: '1.0.0',
    description: `${pattern.name} 最佳实践`,
    category: 'best-practice',
    implementation: generateBestPracticeImplementation(pattern),
    tests: generateBestPracticeTests(pattern),
  };
}
```

#### 1.4 操作组合 Skill
```javascript
function generateOperationCombinationSkill(pattern) {
  const skillName = `quick-${kebabCase(pattern.name)}`;
  
  return {
    name: skillName,
    version: '1.0.0',
    description: `快速执行 ${pattern.name}`,
    category: 'workflow',
    implementation: generateCombinationImplementation(pattern),
    tests: generateCombinationTests(pattern),
  };
}
```

### 2. 生成实现代码

#### 2.1 错误修复代码
```javascript
function generateFixCode(pattern) {
  switch (pattern.pattern.solution.type) {
    case 'retry-with-backoff':
      return `
async function fix${pascalCase(pattern.type)}(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
  } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      console.log(\`Retry \${attempt + 1}/\${maxRetries} after \${delay}ms\`);
      await sleep(delay);
    }
  }
}
`;
    
    case 'fallback':
      return `
async function fix${pascalCase(pattern.type)}(operation, fallback) {
  try {
    return await operation();
  } catch (error) {
    console.warn('Operation failed, using fallback:', error);
    return await fallback();
  }
}
`;
    
    case 'circuit-breaker':
      return `
class ${pascalCase(pattern.type)}CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}
`;
  }
}
```

#### 2.2 工具函数代码
```javascript
function generateToolCode(pattern) {
  // 提取通用逻辑
  const commonLogic = extractCommonLogic(pattern.instances);
  
  // 识别参数
  const parameters = identifyParameters(pattern.instances);
  
  // 生成函数签名
  const signature = generateFunctionSignature(pattern.name, parameters);
  
  // 生成函数体
  const body = generateFunctionBody(commonLogic, parameters);
  
  return `
${signature} {
  ${body}
}
`;
}
```

### 3. 生成测试

#### 3.1 单元测试
```javascript
function generateUnitTests(skill) {
  return `
import { describe, it, expect } from 'vitest';
import { ${skill.name} } from './${skill.name}';

describe('${skill.name}', () => {
  ${generateTestCases(skill)}
});
`;
}

function generateTestCases(skill) {
  const cases = [];
  
  // 正常情况
  cases.push(`
  it('should work with valid input', async () => {
    const result = await ${skill.name}(validInput);
    expect(result).toBeDefined();
  });
  `);
  
  // 边界情况
  cases.push(`
  it('should handle edge cases', async () => {
    const result = await ${skill.name}(edgeCase);
    expect(result).toBeDefined();
  });
  `);
  
  // 错误情况
  cases.push(`
  it('should handle errors gracefully', async () => {
    await expect(${skill.name}(invalidInput)).rejects.toThrow();
  });
  `);
  
  return cases.join('\n');
}
```

#### 3.2 集成测试
```javascript
function generateIntegrationTests(skill) {
  return `
import { describe, it, expect } from 'vitest';
import { ${skill.name} } from './${skill.name}';

describe('${skill.name} integration', () => {
  it('should integrate with workflow', async () => {
    const workflow = createTestWorkflow();
    const result = await workflow.execute();
    expect(result.success).toBe(true);
  });
});
`;
}
```

### 4. 生成文档

#### 4.1 README
```javascript
function generateReadme(skill) {
  return `
# ${skill.name}

${skill.description}

## 安装

\`\`\`bash
# 自动生成，无需手动安装
\`\`\`

## 使用

\`\`\`javascript
${generateUsageExamples(skill)}
\`\`\`

## API

${generateAPIDoc(skill)}

## 示例

${generateExamples(skill)}

## 测试

\`\`\`bash
npm test
\`\`\`

## 贡献

这个 Skill 是自动生成的。如果发现问题，请报告给系统。

## 许可

MIT
`;
}
```

#### 4.2 API 文档
```javascript
function generateAPIDoc(skill) {
  return `
### ${skill.name}(${skill.parameters.map(p => p.name).join(', ')})

${skill.description}

**参数**:
${skill.parameters.map(p => `- \`${p.name}\` (${p.type}): ${p.description}`).join('\n')}

**返回值**: ${skill.returns.type} - ${skill.returns.description}

**示例**:
\`\`\`javascript
${generateUsageExample(skill)}
\`\`\`
`;
}
```

## Skill 模板

### 1. 错误修复模板
```markdown
---
name: fix-{error-type}
version: 1.0.0
description: 自动修复 {error-type} 错误
category: error-fix
---

# fix-{error-type}

## 错误模式
- 触发条件: {trigger}
- 错误症状: {symptom}
- 根本原因: {root-cause}

## 解决方案
{solution}

## 实现
{implementation}

## 测试
{tests}
```

### 2. 工具函数模板
```markdown
---
name: {name}-helper
version: 1.0.0
description: {description}
category: utility
---

# {name}-helper

## 功能
{functionality}

## 参数
{parameters}

## 返回值
{returns}

## 实现
{implementation}

## 使用示例
{examples}
```

### 3. 最佳实践模板
```markdown
---
name: {name}-best-practice
version: 1.0.0
description: {name} 最佳实践
category: best-practice
---

# {name}-best-practice

## 成功模式
- 成功率: {success-rate}
- 平均耗时: {avg-duration}
- 质量评分: {quality-score}

## 操作序列
{sequence}

## 实现
{implementation}

## 使用场景
{use-cases}
```

### 4. 操作组合模板
```markdown
---
name: quick-{name}
version: 1.0.0
description: 快速执行 {name}
category: workflow
---

# quick-{name}

## 组合操作
{operations}

## 实现
{implementation}

## 使用示例
{examples}
```

## 生成流程

```javascript
async function generateSkill(pattern) {
  // 1. 选择模板
  const template = selectTemplate(pattern.type);
  
  // 2. 生成定义
  const definition = generateDefinition(pattern, template);
  
  // 3. 生成实现
  const implementation = generateImplementation(pattern);
  
  // 4. 生成测试
  const tests = generateTests(pattern);
  
  // 5. 生成文档
  const docs = generateDocs(pattern);
  
  // 6. 组装 Skill
  const skill = {
    definition,
    implementation,
    tests,
    docs,
  };
  
  // 7. 写入文件
  await writeSkillFiles(skill);
  
  return skill;
}
```

## 使用示例

### 生成错误修复 Skill
```javascript
const pattern = {
  type: 'MasterGoTimeout',
  frequency: 5,
  pattern: {
    trigger: 'MasterGo API call',
    symptom: 'Request timeout after 30s',
    rootCause: 'Network latency or API overload',
    solution: {
      type: 'retry-with-backoff',
      implementation: 'Add exponential backoff retry logic',
    },
  },
};

const skill = await generateSkill(pattern);
console.log(`Generated skill: ${skill.name}`);
```

### 生成工具函数 Skill
```javascript
const pattern = {
  name: 'feishu-search',
  frequency: 4,
  abstraction: {
    code: 'async function search(query) { ... }',
    parameters: [{ name: 'query', type: 'string' }],
    returns: { type: 'Array', description: 'Search results' },
  },
};

const skill = await generateSkill(pattern);
console.log(`Generated skill: ${skill.name}`);
```

---

**提示**：Skill 创建器会自动生成完整的 Skill，包括实现、测试和文档！
