# 我给 Claude Code / Codex 做了一个“可进化”的工作流层：oh-my-engine

> 不是再堆一堆 prompt，也不是再装一批零散 skill。  
> 我想做的是一层更稳定的东西：让 AI 在项目里有“工作流”、有“记忆”、有“规则”、还能持续沉淀。

![封面图占位：建议放仓库首页截图、项目 logo，或一张终端 + 编辑器同屏图](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80)

最近这段时间，我越来越明显地感觉到一个问题：

用了 Claude Code / Codex 之后，开发效率确实提升了，但工作方式还是有点“脆”。

常见场景大概是这样的：

- 同一个项目规则，每次都要重复讲一遍
- 同一种 Bug 分析流程，每次都从头组织
- UI 还原、API 集成、组件生成这些高频任务，经常是“这次写得不错，下次又忘了”
- 技能越来越多，但都是散的，缺少统一调度和沉淀方式

也就是说，AI 很强，但“过程资产”没有被真正留下来。

所以我做了一个东西：**oh-my-engine**。

它本质上不是单个 skill，而是一层 **workflow engine**。  
目标很直接：

- 把高频任务变成可复用工作流
- 把项目规则变成稳定上下文
- 把执行历史和经验沉淀下来
- 让 Claude Code 和 Codex 都能用起来

GitHub：

```text
https://github.com/oh-my-engine/oh-my-engine
```

> 截图建议：这里放 GitHub 仓库首页截图  
> 推荐内容：star、README 标题、目录结构一屏带上

---

## 它想解决什么问题？

### 1. AI 会写，但不一定会“持续按你的方式写”

很多时候我们不是缺一个更强的模型，而是缺：

- 项目初始化约束
- 固定执行步骤
- 可复用的分析套路
- 长期可积累的规则和偏好

你今天告诉它：

- 组件要怎么拆
- 设计 token 怎么用
- i18n 怎么处理
- Bug 要先查什么再改什么

明天它未必还按这个方式来。

### 2. Prompt 很强，但 prompt 不等于 workflow

我自己后来越来越少去追求“超级 prompt”。

因为真正稳定的产出，往往来自：

- 明确的入口
- 固定的执行顺序
- 项目级配置
- 任务后的结果回收和复用

这也是我做 `oh-my-engine` 的核心原因。

> 截图建议：放一张“杂乱 prompt / skill 列表”或者编辑器里多份零散提示词文件的截图  
> 目的：强化“为什么需要 workflow layer”

---

## 它是什么？

一句话版本：

> **oh-my-engine 是一个给 Claude Code / Codex 用的可复用工作流层。**

它目前做的事情主要有这几类：

- 项目初始化
- UI 还原
- Bug 分析和修复
- 组件生成
- API 集成
- 执行历史与“记忆”查看
- 基于历史的优化/演化

不是把这些能力做成一个巨型命令，而是做成一组可组合的 skills + 配置体系。

---

## 它长什么样？

安装后，大概会落到这些目录：

```text
~/.claude/skills/
~/.codex/skills/

project/
└── .oh-my-engine/
    ├── config.json
    ├── rules/
    └── memory/
```

这里我比较看重的是项目内的 `.oh-my-engine/`：

- `config.json`：项目级工作流配置
- `rules/`：项目自己的规则
- `memory/`：执行历史、学习结果、偏好沉淀

也就是说，它不是只有“全局技能”，而是支持**项目级行为收敛**。

> 截图建议：放本地目录树截图  
> 推荐内容：
>
> ```text
> ~/.codex/skills/oh-my-engine*
> .oh-my-engine/
> ```
>
> 如果能同时截到 `rules/` 和 `memory/` 会更有说服力

---

## 最短体验路径

先安装：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex
```

或者 Claude Code：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude
```

如果你两边都用：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

初始化项目：

**Claude Code**
```bash
/oh-my-engine-init
```

**Codex**
```bash
oh-my-engine-init
```

> 截图建议：这里一定要放终端安装成功截图  
> 推荐内容：
>
> - 安装成功输出
> - `~/.codex/skills` 或 `~/.claude/skills` 下出现 `oh-my-engine-*`
> - 初始化后 `.oh-my-engine/` 目录生成成功

---

## 实际能干什么？

下面放几个更具体的场景。

---

## 场景 1：初始化一个“会记住规则”的项目

很多人装完 skill 之后，下一步就卡住了：  
“然后呢？”

`oh-my-engine-init` 做的事情就是把项目运行环境搭起来。

它会创建：

- 项目配置
- 规则目录
- 记忆目录
- 后续工作流需要的基础结构

你可以理解为：  
**先给 AI 建一个能长期工作的工位。**

### 你会得到什么？

```text
.oh-my-engine/
├── config.json
├── workflows/
├── rules/
└── memory/
```

### 适合什么时候用？

- 新项目刚开始
- 老项目想逐步把 AI 协作方式规范化
- 团队想把“口头约定”收敛成文件化规则

![project setup](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80)

> 截图建议：放初始化前后对比图  
> 推荐内容：
>
> - 左边：普通项目目录
> - 右边：多出 `.oh-my-engine/`

---

## 场景 2：UI 还原不再是“一次性表演”

UI 还原一直是 AI 编码里最容易“看起来很能打，实际很不稳定”的场景。

因为这里不仅是写代码，还涉及：

- 设计稿解析
- 组件结构判断
- token / theme / i18n 规则
- 输出文件位置
- 最终代码风格一致性

`oh-my-engine-ui` 的思路不是“直接吐一段 JSX”，而是把整个动作看成 workflow。

### 输入

```bash
/oh-my-engine-ui <design-url>
```

或在 Codex 中按技能名触发。

### 它关心的不是只有“生成”

还包括：

- 读取设计信息
- 应用项目规则
- 生成组件/样式/类型
- 做基础校验
- 记录这次执行

这样至少不会每次都像在重新赌一次运气。

> 截图建议：这里最适合放一组 2 图
>
> - 图 1：设计稿截图
> - 图 2：生成后的代码或页面效果图

---

## 场景 3：Bug 分析从“拍脑袋修”变成结构化处理

很多 AI 修 Bug 的问题在于：

- 看见报错就改
- 改完一个点，不知道有没有副作用
- 没有统一的问题分析结构
- 上次踩过的坑，下次还踩

`oh-my-engine-bug` 想做的是把 Bug 处理流程固定下来。

它不是只接一句“帮我修一下”，而是偏向这种思路：

1. 先理解问题
2. 确认复现信息
3. 分析影响范围
4. 找根因
5. 实施修复
6. 做回归验证
7. 记录这次经验

这种方式不一定比“直接冲进去改”更炫，但更稳。

![bug analysis](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80)

> 截图建议：这里放一张修 Bug 的执行过程图
>
> - 比如 issue 描述
> - 分析输出
> - 修复后的 diff

---

## 场景 4：组件生成不只是脚手架

我知道很多人一看到“生成组件”就会皱眉：

> 不就是又一个脚手架生成器？

问题确实在这。

如果只是生成一个空壳组件，意义不大。  
真正有价值的是：

- 它知不知道项目组件放哪
- 它知不知道命名约定
- 它会不会自动带上测试/类型/样式
- 它会不会遵守设计 token 和代码风格

`oh-my-engine-comp` 目前更偏向后者。

比如你可以让它生成某种类型组件，并让它落在项目习惯的位置里，而不是吐一个和项目毫无关系的示例文件。

> 截图建议：放组件生成前后的目录和代码片段  
> 推荐内容：
>
> - `src/components/...`
> - 新增的 `.tsx` / `.test.tsx` / `styles` 文件

---

## 场景 5：API 集成更像“流程”而不是“复制粘贴”

API 集成也是一个高频但容易碎裂的活。

实际做的时候往往不只是请求函数本身，还会涉及：

- 规范读取
- 类型生成
- 错误处理
- mock / test
- 服务组织方式

`oh-my-engine-api` 这里也是 workflow 思路：

- 先理解规范
- 再生成客户端和类型
- 再考虑测试和错误处理
- 最后把结果纳入项目结构

这类任务最怕“看起来已经完成，实际上只是把请求写出来了”。

> 截图建议：放 API spec 和生成后的 service 文件对照图

---

## 不是只有技能，还有“记忆”和“演化”

这块其实是我最想继续做深的部分。

`oh-my-engine-memory` 和 `oh-my-engine-evolve` 的方向是：

- 回看过去做过什么
- 统计哪些 workflow 最常用
- 哪些流程成功率高
- 哪些地方反复失败
- 有没有东西值得沉淀成新的 skill / rule

也就是说，目标不是停留在：

> “装了几个技能”

而是往这个方向走：

> “项目里的 AI 协作方式，可以被观察、被优化、被积累”

这个思路我觉得会比“再写 50 个零散 prompt”更有长期价值。

> 截图建议：如果你还没有真实数据，这里宁可不放图  
> 不要放太“概念图”的图，容易显得空

---

## 我觉得它适合谁？

比较适合这几类人：

- 已经在用 Claude Code / Codex
- 手上有重复性比较高的开发流程
- 想把项目规则沉淀下来
- 不想每次都重新教 AI 一遍
- 对“可复用工作流”比“单次神 prompt”更感兴趣

不太适合：

- 只想临时跑一两次 demo
- 还没形成任何项目规则
- 暂时不在意流程稳定性

---

## 它和普通 skill / prompt 的区别

我自己会这样总结：

### 普通 prompt
- 快
- 灵活
- 一次性强
- 但不容易沉淀

### 单个 skill
- 比 prompt 稍稳
- 有固定入口
- 但通常还是偏离散

### oh-my-engine
- 强调 workflow
- 强调项目配置
- 强调可积累
- 强调后续演化

它不是要替代 prompt，而是给那些“已经证明会反复发生”的任务，提供一个更稳定的归宿。

> 截图建议：这里可以不放图，让文字更紧凑

---

## 我现在最在意的两点

### 1. Claude Code 和 Codex 要分开对待

这次我专门修了一轮兼容性文档，就是因为这件事非常容易被忽略。

目前的使用建议是：

- **Claude Code**：按 slash command 用
- **Codex**：按技能名触发，不默认假设 slash command 一定存在

这点如果不讲清楚，用户第一反应就是“安装失败”。

### 2. 不想把它做成又一个“概念项目”

这类项目最容易陷入一个陷阱：

- 讲架构讲得很大
- 讲智能讲得很玄
- 但用户装完不知道怎么开始

所以我现在尽量让它保持：

- 可安装
- 可初始化
- 有具体场景
- 有清晰触发入口

---

## 你可以怎么试？

最简单就是：

1. 装一下
2. 找一个你现在正在做的项目
3. 初始化
4. 选一个真实任务试一次

比如：

- 初始化项目规则
- 从设计稿还原一个页面
- 分析一个具体 bug
- 生成一个项目内组件
- 基于 OpenAPI 规范接一个服务

如果你已经长期用 Claude Code / Codex，我觉得你会很快感受到“有 workflow 层”和“没有 workflow 层”的差别。

---

## 仓库地址

```text
https://github.com/oh-my-engine/oh-my-engine
```

如果你对下面这些方向感兴趣，也欢迎交流：

- Claude Code / Codex 的工作流抽象
- AI coding 的项目级规则收敛
- skill 的长期沉淀方式
- 记忆 / 演化在工程里的实际价值
- 怎么把“这次写得不错”变成“下次还能稳定复现”

---

## 最后

我现在越来越觉得，AI coding 的下一阶段不只是“模型更强”，而是：

- 上下文更稳定
- 项目规则更可继承
- 常见任务更可复用
- 历史经验更可沉淀

`oh-my-engine` 就是我在这个方向上的一次尝试。

如果你也在折腾 Claude Code / Codex，欢迎试试，也欢迎直接拍砖。

---

## 安装命令合集

```bash
# Claude Code
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# Codex
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# Both
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

> 截图建议：最后可以再放一张安装成功或效果总览图，形成收尾

---

## 评论引导

如果你现在也在用 Claude Code / Codex，最想沉淀成 workflow 的任务是什么？  
UI 还原、Bug 修复、API 集成，还是别的东西？欢迎留言，我可以继续补对应示例。

---

## 发帖前替换建议

把下面这些“占位图”优先换成你自己的真实截图，效果会明显更好：

1. GitHub 仓库首页截图
2. 安装成功终端截图
3. `.oh-my-engine/` 目录结构截图
4. 一个真实案例的前后对比图
5. Claude Code / Codex 实际触发工作流的截图

如果你只能放 3 张图，优先级建议是：

1. 安装成功图
2. 项目目录/初始化图
3. 一个真实任务结果图
