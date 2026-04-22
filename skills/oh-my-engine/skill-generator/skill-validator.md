---
name: skill-validator
version: 1.0.0
description: 验证生成的 Skill
category: skill-generator
---

# Skill 验证器 (Skill Validator)

验证生成的 Skill 是否符合质量标准。

## 核心功能

### 1. 语法验证

#### 1.1 Markdown 语法
```javascript
function validateMarkdownSyntax(skillFile) {
  const content = fs.readFileSync(skillFile, 'utf-8');
  
  // 检查 frontmatter
  const hasFrontmatter = /^---\n[\s\S]+?\n---/.test(content);
  if (!hasFrontmatter) {
    return { valid: false, error: 'Missing frontmatter' };
  }
  
  // 检查必需字段
  const frontmatter = parseFrontmatter(content);
  const requiredFields = ['name', 'version', 'description'];
  const missingFields = requiredFields.filter(field => !frontmatter[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }
  
  return { valid: true };
}
```

#### 1.2 代码语法
```javascript
function validateCodeSyntax(skill) {
  const codeBlocks = extractCodeBlocks(skill.implementation);
  
  for (const block of codeBlocks) {
    if (block.language === 'javascript' || block.language === 'typescript') {
      try {
        // 使用 esprima 或 @babel/parser 解析
        parse(block.code);
      } catch (error) {
        return {
          valid: false,
          error: `Syntax error in code block: ${error.message}`,
          location: block.location,
        };
      }
    }
  }
  
  return { valid: true };
}
```

### 2. 结构验证

#### 2.1 文件结构
```javascript
function validateFileStructure(skillDir) {
  const requiredFiles = [
    'SKILL.md',           // Skill 定义
    'README.md',          // 文档
  ];
  
  const optionalFiles = [
    'tests/',             // 测试目录
    'examples/',          // 示例目录
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(skillDir, file))
  );
  
  if (missingFiles.length > 0) {
    return {
      valid: false,
      error: `Missing required files: ${missingFiles.join(', ')}`,
    };
  }
  
  return { valid: true };
}
```

#### 2.2 内容结构
```javascript
function validateContentStructure(skill) {
  const requiredSections = [
    '# ' + skill.name,    // 标题
    '## 功能',            // 功能说明
    '## 实现',            // 实现代码
    '## 使用示例',        // 使用示例
  ];
  
  const content = skill.implementation;
  const missingSections = requiredSections.filter(section => 
    !content.includes(section)
  );
  
  if (missingSections.length > 0) {
    return {
      valid: false,
      error: `Missing required sections: ${missingSections.join(', ')}`,
    };
  }
  
  return { valid: true };
}
```

### 3. 功能验证

#### 3.1 运行测试
```javascript
async function runTests(skill) {
  const testDir = path.join(skill.dir, 'tests');
  
  if (!fs.existsSync(testDir)) {
    return {
      valid: false,
      error: 'No tests found',
    };
  }
  
  try {
    // 运行测试
    const result = await exec(`npm test`, { cwd: skill.dir });
    
    return {
      valid: result.exitCode === 0,
      output: result.stdout,
      error: result.stderr,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}
```

#### 3.2 集成测试
```javascript
async function runIntegrationTests(skill) {
  // 创建测试工作流
  const workflow = createTestWorkflow(skill);
  
  try {
    // 执行工作流
    const result = await workflow.execute();
    
    return {
      valid: result.success,
      duration: result.duration,
      output: result.output,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}
```

### 4. 质量验证

#### 4.1 代码质量
```javascript
function validateCodeQuality(skill) {
  const issues = [];
  
  // 检查代码复杂度
  const complexity = calculateComplexity(skill.implementation);
  if (complexity > 10) {
    issues.push({
      type: 'complexity',
      severity: 'warning',
      message: `High complexity: ${complexity}`,
    });
  }
  
  // 检查代码重复
  const duplication = detectDuplication(skill.implementation);
  if (duplication > 0.2) {
    issues.push({
      type: 'duplication',
      severity: 'warning',
      message: `High duplication: ${duplication * 100}%`,
    });
  }
  
  // 检查命名规范
  const namingIssues = checkNamingConventions(skill.implementation);
  issues.push(...namingIssues);
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  };
}
```

#### 4.2 文档质量
```javascript
function validateDocQuality(skill) {
  const issues = [];
  
  // 检查文档完整性
  const requiredSections = [
    'description',
    'parameters',
    'returns',
    'examples',
  ];
  
  const missingSections = requiredSections.filter(section => 
    !hasSection(skill.docs, section)
  );
  
  if (missingSections.length > 0) {
    issues.push({
      type: 'documentation',
      severity: 'error',
      message: `Missing sections: ${missingSections.join(', ')}`,
    });
  }
  
  // 检查示例代码
  const examples = extractExamples(skill.docs);
  if (examples.length === 0) {
    issues.push({
      type: 'documentation',
      severity: 'warning',
      message: 'No examples found',
    });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  };
}
```

### 5. 性能验证

#### 5.1 执行时间
```javascript
async function validatePerformance(skill) {
  const samples = [];
  const iterations = 10;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await skill.execute(testInput);
    const duration = Date.now() - start;
    samples.push(duration);
  }
  
  const avgDuration = samples.reduce((a, b) => a + b) / samples.length;
  const maxDuration = Math.max(...samples);
  
  return {
    valid: avgDuration < 5000, // 平均 < 5s
    avgDuration,
    maxDuration,
    samples,
  };
}
```

#### 5.2 资源使用
```javascript
async function validateResourceUsage(skill) {
  const before = process.memoryUsage();
  
  await skill.execute(testInput);
  
  const after = process.memoryUsage();
  const memoryIncrease = after.heapUsed - before.heapUsed;
  
  return {
    valid: memoryIncrease < 50 * 1024 * 1024, // < 50MB
    memoryIncrease,
    before,
    after,
  };
}
```

## 验证报告

```json
{
  "skill": "fix-mastergo-timeout",
  "timestamp": "2024-01-15T10:30:00Z",
  "validation": {
    "syntax": {
      "valid": true,
      "markdown": { "valid": true },
      "code": { "valid": true }
    },
    "structure": {
      "valid": true,
      "files": { "valid": true },
      "content": { "valid": true }
    },
    "functionality": {
      "valid": true,
      "unitTests": {
        "valid": true,
        "passed": 10,
        "failed": 0,
        "coverage": "95%"
      },
      "integrationTests": {
        "valid": true,
        "duration": "2.5s"
      }
    },
    "quality": {
      "valid": true,
      "code": {
        "valid": true,
        "complexity": 5,
        "duplication": 0.05,
        "issues": []
      },
      "documentation": {
        "valid": true,
        "completeness": "100%",
        "examples": 3
      }
    },
    "performance": {
      "valid": true,
      "avgDuration": "1.2s",
      "maxDuration": "1.8s",
      "memoryIncrease": "5MB"
    }
  },
  "overallScore": 95,
  "grade": "A",
  "recommendation": "Ready for production"
}
```

## 验证等级

### A 级（90-100 分）
- 所有验证通过
- 代码质量优秀
- 文档完整
- 性能良好
- **推荐**: 立即投入使用

### B 级（80-89 分）
- 核心功能正常
- 有少量警告
- 文档基本完整
- 性能可接受
- **推荐**: 修复警告后使用

### C 级（70-79 分）
- 功能基本可用
- 有多个警告
- 文档不完整
- 性能一般
- **推荐**: 改进后使用

### D 级（60-69 分）
- 功能不稳定
- 有严重问题
- 文档缺失
- 性能较差
- **推荐**: 重新生成

### F 级（< 60 分）
- 验证失败
- 无法使用
- **推荐**: 废弃

## 自动修复

### 1. 语法错误
```javascript
async function autoFixSyntaxErrors(skill) {
  const issues = await validateCodeSyntax(skill);
  
  if (!issues.valid) {
    // 尝试自动修复
    const fixed = await fixSyntaxError(skill, issues.error);
    
    // 重新验证
    const revalidation = await validateCodeSyntax(fixed);
    
    return {
      fixed: revalidation.valid,
      skill: fixed,
    };
  }
  
  return { fixed: false };
}
```

### 2. 格式问题
```javascript
async function autoFixFormatting(skill) {
  // 使用 Prettier 格式化
  const formatted = await prettier.format(skill.implementation, {
    parser: 'markdown',
    proseWrap: 'always',
  });
  
  return {
    ...skill,
    implementation: formatted,
  };
}
```

### 3. 文档缺失
```javascript
async function autoFixDocumentation(skill) {
  const issues = validateDocQuality(skill);
  
  if (!issues.valid) {
    // 自动生成缺失的文档
    const missingDocs = generateMissingDocs(skill, issues.issues);
    
    return {
      ...skill,
      docs: {
        ...skill.docs,
        ...missingDocs,
      },
    };
  }
  
  return skill;
}
```

## 使用示例

### 验证单个 Skill
```javascript
const skill = loadSkill('fix-mastergo-timeout');
const validation = await validateSkill(skill);

if (validation.valid) {
  console.log('✅ Skill is valid');
  console.log(`Score: ${validation.overallScore}`);
  console.log(`Grade: ${validation.grade}`);
} else {
  console.log('❌ Skill validation failed');
  console.log(`Errors: ${validation.errors.join(', ')}`);
}
```

### 批量验证
```javascript
const skills = loadAllSkills();
const results = await Promise.all(
  skills.map(skill => validateSkill(skill))
);

const passed = results.filter(r => r.valid).length;
console.log(`${passed}/${skills.length} skills passed validation`);
```

### 自动修复
```javascript
const skill = loadSkill('fix-mastergo-timeout');
const validation = await validateSkill(skill);

if (!validation.valid) {
  console.log('Attempting auto-fix...');
  
  const fixed = await autoFix(skill, validation);
  
  if (fixed.success) {
    console.log('✅ Auto-fix successful');
    await saveSkill(fixed.skill);
  } else {
    console.log('❌ Auto-fix failed, manual intervention required');
  }
}
```

---

**提示**：验证器会确保生成的 Skill 符合质量标准，并尝试自动修复问题！
