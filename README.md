# 기대치 정렬 앱 - 1단계: 데이터 모델 / 백엔드

## 폴더 구조

```
expectation-gap-app/
├── index.html          # 2단계에서 작성 (프론트 전체, 4탭)
├── api/
│   └── state.js        # KV 저장/조회 API (완료)
├── package.json
└── vercel.json          # 필요 시 추가
```

## 데이터 모델 (Vercel KV)

| 키 패턴 | 값(JSON) | 설명 |
|---|---|---|
| `task:{taskId}` | `{ id, title, description, dueDate, leaderName, memberName, status, createdAt }` | 업무 기본 정보. status: `collecting` → `analyzing` → `agreed` |
| `expectation:{taskId}:leader` | `{ answers: { why1, why2, what1, what2, output1, output2 }, submittedAt }` | 팀장 답변 |
| `expectation:{taskId}:member` | 위와 동일 구조 | 팀원 답변 |
| `gap:{taskId}` | `{ areas: { WHY: {...}, WHAT: {...}, OUTPUT: {...} }, generatedAt }` | AI Gap 분석 결과 |
| `agreement:{taskId}` | `{ agreed: { WHY, WHAT, OUTPUT }, agreedAt }` | 최종 합의 내용 |

`gap` 영역별 값 구조:

```json
{
  "gapDescription": "팀장은 ~라고 기대, 팀원은 ~라고 이해하고 있어 차이가 있음",
  "gapLevel": "high | medium | low",
  "interviewQuestions": ["...", "..."]
}
```

- `gapLevel`은 점수가 아니라 면담 순서 정렬용 라벨. 화면 표시는 "차이가 큽니다/보통입니다/거의 일치합니다" 문구로 변환.

## API 사용법 (`/api/state`)

| 동작 | 요청 |
|---|---|
| 업무 조회 | `GET /api/state?type=task&taskId=xxx` |
| 업무 저장 | `POST { type:'task', taskId, data }` |
| 내 기대치 저장 | `POST { type:'expectation', taskId, role:'leader'|'member', data }` |
| 양측 기대치 한번에 조회 | `GET /api/state?type=expectation&taskId=xxx` → `{ leader, member }` |
| Gap 분석 저장/조회 | `type=gap` |
| 합의 저장/조회 | `type=agreement` |

## 배포 전 설정 (사용자가 할 일)

| 순서 | 할 일 |
|---|---|
| 1 | Vercel 프로젝트 생성 후 Storage 탭에서 KV(Upstash) 데이터베이스 연결 → `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수 자동 등록 |
| 2 | Gemini API 키는 서버에 저장하지 않음. 각자 브라우저 localStorage에 본인 키를 저장해 사용 (2단계 UI에서 안내) |
| 3 | `taskId`는 업무 생성 시 프론트에서 랜덤 생성(`crypto.randomUUID()`), 링크(`?taskId=xxx&role=member`)로 팀원에게 전달 |

## 알려진 제한 (MVP 범위)

- 업무 목록 조회 기능 없음. taskId를 아는 사람만 접근 가능(링크 기반).
- 별도 로그인/인증 없음. taskId가 사실상 접근 키 역할.
