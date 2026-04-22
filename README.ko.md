# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> 메모리와 학습 기능을 갖춘 자체 진화 워크플로우 엔진 (Claude Code용)

Oh My Engine은 Claude Code를 지능형 워크플로우 시스템으로 변환하는 강력한 프레임워크입니다. 사용 패턴에서 학습하고, 선호도를 기억하며, 자동으로 진화하여 맞춤형 워크플로우를 생성합니다.

## ✨ 특징

- **🧠 메모리 시스템**: 실행 기록, 학습 내용, 사용자 선호도 기억
- **🔄 자체 진화**: 패턴을 자동으로 식별하고 새로운 스킬 생성
- **⚙️ 프로젝트 구성**: `.oh-my-engine/`을 통한 프로젝트별 워크플로우 커스터마이징
- **📋 풍부한 워크플로우**: UI 복원, 버그 분석, 컴포넌트 생성, API 통합 등 사전 구축된 워크플로우
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

#### 방법 2: 클론 후 설치

```bash
# 저장소 클론
git clone https://github.com/oh-my-engine/oh-my-engine.git

# 설치 스크립트 실행
cd oh-my-engine
chmod +x install.sh
./install.sh
```

#### 방법 3: AI로 설치

[INSTALL_WITH_AI.md](INSTALL_WITH_AI.md)의 설치 프롬프트를 복사하여 AI 어시스턴트(Claude, ChatGPT 등)에 붙여넣으면 AI가 설치를 안내합니다.

설치 프로그램은 모든 스킬을 `~/.claude/skills/`에 복사하여 Claude Code에서 전역적으로 사용할 수 있게 합니다.

### 프로젝트 초기화

프로젝트 디렉토리에서:

```bash
/oh-my-engine-init
```

다음을 포함하는 `.oh-my-engine/` 디렉토리가 생성됩니다:
- `config.json` - 워크플로우 구성
- `rules/` - 프로젝트별 규칙
- `memory/` - 실행 기록 및 학습 내용 (git 무시)

### 사용 가능한 명령어

- `/oh-my-engine-init` - 현재 프로젝트에서 Oh My Engine 초기화
- `/oh-my-engine-ui` - 디자인 파일이나 스크린샷에서 UI 복원
- `/oh-my-engine-bug` - 컨텍스트와 함께 버그 분석 및 수정
- `/oh-my-engine-comp` - 사양에서 컴포넌트 생성
- `/oh-my-engine-api` - API 통합 및 오류 처리
- `/oh-my-engine-memory` - 실행 기록 및 학습 내용 보기
- `/oh-my-engine-evolve` - 패턴 분석 및 새로운 워크플로우 제안

## 📖 문서

- [아키텍처 개요](docs/architecture.md)
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
1. `.oh-my-engine/config.json` 로드
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
~/.claude/skills/           # 전역 스킬 (install.sh로 설치)
├── oh-my-engine/          # 코어 프레임워크
├── oh-my-engine-init/     # 프로젝트 초기화
├── oh-my-engine-ui/       # UI 복원 워크플로우
├── oh-my-engine-bug/      # 버그 분석 워크플로우
├── oh-my-engine-comp/     # 컴포넌트 생성 워크플로우
├── oh-my-engine-api/      # API 통합 워크플로우
├── oh-my-engine-memory/   # 메모리 뷰어
└── oh-my-engine-evolve/   # 진화 분석기

project/
└── .oh-my-engine/         # 프로젝트별 구성
    ├── config.json        # 워크플로우 설정
    ├── rules/             # 프로젝트 규칙 (git 커밋)
    └── memory/            # 실행 기록 (git 무시)
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

Anthropic의 [Claude Code](https://claude.ai/code)를 위해 제작되었습니다.

---

**참고**: Oh My Engine은 Claude Code가 필요합니다. 이 프레임워크를 사용하기 전에 Claude Code가 설치되고 구성되어 있는지 확인하세요.
