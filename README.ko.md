# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Current usage note: `ome` is the TypeScript-driven source of truth. Install the CLI with `npm install -g oh-my-engine`, initialize projects with `ome init && ome rules sync`, and use optional Claude Code/Codex skills only for native agent entry points. See [docs/installation-and-usage.md](docs/installation-and-usage.md).

> 메모리와 학습 기능을 갖춘 자체 진화 워크플로우 엔진 (Claude Code and Codex용)

Oh My Engine은 Claude Code and Codex를 지능형 워크플로우 시스템으로 변환하는 강력한 프레임워크입니다. 사용 패턴에서 학습하고, 선호도를 기억하며, 자동으로 진화하여 맞춤형 워크플로우를 생성합니다.

## ✨ 특징

- **🧠 메모리 시스템**: 실행 기록, 학습 내용, 사용자 선호도 기억
- **🔄 자체 진화**: 패턴을 자동으로 식별하고 새로운 스킬 생성
- **⚙️ 프로젝트 구성**: `.ome/`을 통한 프로젝트별 워크플로우 커스터마이징
- **📋 풍부한 워크플로우**: UI 복원, 버그 분석, 컴포넌트 생성, API 통합 등 사전 구축된 워크플로우
- **📝 Spec 모드**: 변경 제안, 계획, 적용, 검증, 아카이브를 위한 OpenSpec 호환 워크플로우
- **🎯 스마트 컨텍스트**: 프로젝트별 규칙 및 구성 자동 로드
- **🔧 확장 가능**: 특정 요구사항에 맞는 커스텀 워크플로우 쉽게 생성

## 🚀 빠른 시작

### 설치

#### 방법 1: 빠른 설치 (권장)

모든 것을 설치하는 하나의 명령어:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

또는 wget 사용:

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**특정 에이전트에만 설치:**

```bash
# Claude Code만
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# Codex만
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# 둘 다
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### 방법 2: 클론 후 설치

```bash
# 저장소 클론
git clone https://github.com/oh-my-engine/oh-my-engine.git

# 설치 스크립트 실행
cd oh-my-engine
chmod +x install.sh

# 에이전트 자동 감지
./install.sh

# 또는 에이전트 지정
./install.sh --agent claude   # Claude Code만
./install.sh --agent codex    # Codex만
./install.sh --agent both     # 두 에이전트 모두
```

#### 방법 3: AI로 설치

[INSTALL_WITH_AI.md](INSTALL_WITH_AI.md)의 설치 프롬프트를 복사하여 AI 어시스턴트(Claude, ChatGPT 등)에 붙여넣으면 AI가 설치를 안내합니다.

설치 프로그램은 모든 스킬을 `~/.claude/skills/` 및/또는 `~/.codex/skills/`에 복사합니다.

Claude Code에서는 설치된 워크플로를 slash command로 호출할 수 있습니다.
Codex에서는 설치된 스킬 이름으로 호출해야 하며, `/oh-my-engine-*` 형식이 항상 제공된다고 가정하면 안 됩니다.

### 프로젝트 초기화

프로젝트 디렉토리에서:

**Claude Code:**
```bash
/ome-init
```

**Codex:**
```bash
ome-init
```

다음을 포함하는 `.ome/` 디렉토리가 생성됩니다:
- `config.json` - 워크플로우 구성
- `rules/` - 프로젝트별 규칙
- `memory/` - 실행 기록 및 학습 내용 (git 무시)

또한 장기 사양과 진행 중인 변경을 위한 `openspec/` 작업 공간도 생성됩니다:
- `project.md` - 프로젝트 수준 컨텍스트
- `changes/` - 진행 중인 변경
- `specs/` - 안정적인 capability spec
- `archive/` - 완료된 변경

### 사용 가능한 명령어

- Claude Code: `/ome-init`, `/ome-ui`, `/ome-bug`, `/ome-comp`, `/ome-api`, `/ome-spec`, `/ome-memory`, `/ome-evolve`
- Codex 스킬 이름: `ome-init`, `ome-ui`, `ome-bug`, `ome-comp`, `ome-api`, `ome-spec`, `ome-memory`, `ome-evolve`

### Spec 워크플로우

```bash
# spec 작업 공간 초기화
ome spec init

# PRD 입력과 작업자 의도를 가져오기
ome spec import user-authentication

# 가져온 컨텍스트에서 proposal/design/tasks/spec delta 준비
ome spec decompose user-authentication

# 수동 scaffold 경로도 계속 사용 가능
ome spec propose user-authentication

# 실행 컨텍스트 정제 및 로드
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication

# 변경 검증 및 아카이브
ome spec verify user-authentication
ome spec archive user-authentication
```

`import`는 정규화된 소스 텍스트, 프롬프트 입력, 추적 정보, 복사된 첨부 파일을 `openspec/changes/<change-id>/context/` 아래에 저장합니다. `decompose`는 이 intake 컨텍스트를 `analysis.md`, `proposal.md`, `design.md`, `tasks.md`, spec delta로 변환하면서 소스 참조를 변경과 함께 유지합니다. `apply`는 라이프사이클 상태를 갱신하고, 작업과 수용 기준 진행 상황을 표시할 수 있으며, 에이전트가 로드해야 할 파일을 출력합니다. 프로덕션 코드를 자동 생성하지는 않습니다. `status`는 현재 단계와 남은 항목을 요약합니다. `archive`는 첫 수용 시 장기 capability spec을 만들고, 수용된 delta로부터 canonical summary, requirements, compatibility를 다시 구성하며, 현재 수용된 스냅샷과 아카이브 이력을 모두 유지합니다.
`.ome/config.json`의 `workflows.spec.options.verifyCommands` 아래에 실제 프로젝트 검사를 추가할 수 있습니다. `verify`는 이를 순차적으로 실행하고, 첫 번째 비정상 종료 코드에서 실패합니다. 또한 `verify`는 해결되지 않은 `TBD:` 마커를 차단하고, 각 spec delta가 정확히 하나의 변경 유형을 선택하며 최소 하나의 구체적인 requirement와 WHEN/THEN 시나리오를 포함하도록 요구합니다.

## 📖 문서

- [아키텍처 개요](docs/architecture.md)
- [프롬프트 기반 Spec Intake 아키텍처](docs/spec-intake-architecture.md)
- [커스텀 워크플로우 생성](docs/custom-workflows.md)
- [구성 가이드](docs/configuration.md)
- [메모리 시스템](docs/memory-system.md)
- [진화 메커니즘](docs/evolution.md)

## 🎯 예제

### React Native 프로젝트

[examples/react-native](examples/react-native)에서 다음을 포함한 전체 구성 예제를 확인하세요:
- 다국어 지원을 위한 i18n 규칙
- 테마 시스템 통합
- 디자인 토큰
- 코드 스타일 가이드라인

### 커스텀 워크플로우

```markdown
---
name: oh-my-engine-deploy
description: 사전 점검이 포함된 애플리케이션 배포
---

# 배포 워크플로우

## 컨텍스트 로드
1. `.ome/config.json` 로드
2. 배포 구성 확인
3. 환경 변수 검증

## 사전 점검
- 테스트 실행
- 빌드 상태 확인
- 종속성 검증

## 배포
- 프로덕션 번들 빌드
- 구성된 환경에 배포
- 배포 로그 업데이트

## 배포 후
- 실행 내용을 메모리에 저장
- 학습 내용 업데이트
```

## 🏗️ 아키텍처

```
~/.claude/skills/           # Claude Code 스킬
~/.codex/skills/            # Codex 스킬
├── oh-my-engine/          # 코어 프레임워크
├── ome-init/     # 프로젝트 초기화
├── ome-ui/       # UI 복원 워크플로우
├── ome-bug/      # 버그 분석 워크플로우
├── ome-comp/     # 컴포넌트 생성 워크플로우
├── ome-api/      # API 통합 워크플로우
├── ome-spec/     # OpenSpec 호환 spec 워크플로우
├── ome-memory/   # 메모리 뷰어
└── ome-evolve/   # 진화 분석기

project/
├── .ome/         # 프로젝트별 구성 및 메모리
│   ├── config.json        # 워크플로우 설정
│   ├── rules/             # 프로젝트 규칙 (git 커밋)
│   └── memory/            # 실행 기록 (git 무시)
└── openspec/              # OpenSpec 호환 작업 공간
    ├── project.md         # 프로젝트 컨텍스트
    ├── changes/           # 진행 중인 변경
    │   └── <change-id>/context/  # 가져온 PRD, 프롬프트, 분석, 참조, 첨부 파일
    ├── specs/             # 안정적인 capability spec
    └── archive/           # 완료된 변경
```

## 🤝 기여

기여를 환영합니다! 언제든지 Pull Request를 제출해 주세요.

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 열기

## 📝 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 🙏 감사의 말

Anthropic의 [Claude Code](https://claude.ai/code)와 [Codex](https://codex.dev)를 위해 제작되었습니다.

---

**참고**: Oh My Engine은 Claude Code 또는 Codex가 필요합니다. 사용 전에 둘 중 하나 이상이 설치되고 구성되어 있는지 확인하세요.
