# Architecture Decision Records (ADR)

이 디렉토리는 DayMatch 프로젝트의 주요 아키텍처 결정을 기록합니다.

## ADR이란?

Architecture Decision Record는 중요한 아키텍처 결정과 그 이유를 문서화하는 방법입니다. 이를 통해:

- 왜 특정 기술/방식을 선택했는지 기록
- 새로운 팀원이 맥락을 빠르게 이해
- 미래의 자신에게 결정 이유 전달

## 현재 ADR 목록

| ID | 제목 | 상태 |
|----|------|------|
| [0001](./0001-tech-stack-selection.md) | 기술 스택 선택 | 승인됨 |
| [0002](./0002-authentication-strategy.md) | 인증 전략 | 승인됨 |
| [0003](./0003-payment-integration.md) | 결제 시스템 통합 | 승인됨 |

## ADR 템플릿

새로운 결정을 기록할 때 사용하세요:

```markdown
# ADR XXXX: [제목]

## 상태
[제안됨 | 승인됨 | 폐기됨 | 대체됨]

## 컨텍스트
[결정이 필요한 상황 설명]

## 결정
[선택한 방향 설명]

## 결과
[결정의 영향 - 장점, 단점, 트레이드오프]
```

## 참고 자료

- [ADR GitHub](https://adr.github.io/)
- [Michael Nygard's ADR Article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
