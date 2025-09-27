# SNS Feed API

- 소셜 미디어 피드 API 서버입니다. NestJS, Prisma, MySQL을 사용하여 구현되었습니다.
- ⚠ 레포지토리에 로컬 환경 구축용 env 파일이 포함되어있습니다. 실제 배포용으로 이 레포를 사용하려면 파일 삭제 후 gitignore 처리하는 등 보안 처리가 필요합니다.
## 주요 기능
- 사용자 회원가입/로그인 (JWT 인증)
- 게시물 작성/조회/수정/삭제 (이미지 업로드 지원)
- 좋아요/댓글/리트윗 기능
- 커서 기반 페이지네이션
- 카테고리별 게시물 분류


## 디렉토리 구조
```
src/
├── auth/           # 인증 (로그인, JWT, 토큰 관리)
├── users/          # 사용자 관리 (회원가입, 프로필)
├── posts/          # 게시물 CRUD
├── categories/     # 카테고리 관리
├── likes/          # 좋아요 기능
├── comments/       # 댓글 기능
├── retweets/       # 리트윗 기능
├── prisma/         # 데이터베이스 서비스
└── main.ts         # 앱 진입점

prisma/
├── schema.prisma   # 데이터베이스 스키마
├── seed.ts         # 초기 데이터
└── migrations/     # 마이그레이션 파일
```

## 실행방법
### 1. 프로젝트 다운로드
```
$ git clone https://github.com/CSH111/sns-feed-api.git
```

### 2. Docker Engine 실행(Docker Deskop 등)
### 3. 도커에서 MySQL Server 및 nest 실행

```
$ cd sns-feed-api

# 개발모드 실행시
$ npm run docker:dev

# 프로덕션모드 실행시
$ npm run docker:prod

# 개발 <--> 프로덕션 변경시
$ npm run docker:down // 이후 실행
```

### 4. 접속주소
- nest app
  - http://127.0.0.1:5656/api
  - ⚠ localhost 사용시 도커-윈도우 사용자의경우 원활하지않을 수 있습니다- 127.0.0.1 사용권장

## API 문서
- Swagger를 통한 API 문서를 제공합니다.
- http://127.0.0.1:5656/api


## 구현 중점사항
### 게시글 조회 - 커서 기반 페이지네이션
- 실시간으로 새 게시물이 추가되어도 중복 조회를 방지합니다.
- SNS 피드의 실시간성을 위한 합리적인 구조를 구현했습니다.

### JWT 다중 기기 로그인
- 기기별 독립적인 Refresh Token 관리로 동시 로그인을 지원합니다.
- PC, 모바일, 태블릿 등 여러 기기에서 개별 세션을 유지해 SNS 사용 패턴에 최적화된 인증 시스템을 구현했습니다.

## 기술 스택 선정이유
- prisma
  - 간결하고 단순한 쿼리 메서드와 자동 타입생성으로 뛰어난 개발자 경험을 제공합니다.
- swagger
  - OpenAPI Specification에 따라 쉽고 명확한 api문서를 작성할 수 있으며 Try it out 기능을 통해 API 테스팅이 용이합니다.
