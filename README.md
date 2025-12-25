# ♟️ 꼬마 체스 선생님 - AI와 함께하는 체스 여행

> 아이들을 위한 친절한 AI 체스 게임입니다. OpenAI GPT를 활용하여 아이들이 체스를 배우고 즐길 수 있도록 도와주는 웹 애플리케이션입니다.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📖 프로젝트 소개

**꼬마 체스 선생님**은 초등학생을 위한 교육용 체스 게임입니다. AI가 아이의 이름을 부르며 격려하고 칭찬하는 친절한 멘트로 체스를 가르칩니다. 게임 기록을 저장하여 아이의 성장 과정을 추적할 수 있습니다.

### 주요 기능

- 🤖 **AI 체스 상대**: OpenAI GPT를 활용한 지능형 체스 상대
- 👶 **아이 친화적 UI**: 초등학생도 쉽게 사용할 수 있는 직관적인 인터페이스
- 💬 **격려 멘트**: AI가 아이의 이름을 부르며 친절하게 격려
- 📊 **게임 기록**: 승패와 게임 수를 기록하여 성장 추적
- 📱 **모바일 지원**: 스마트폰과 태블릿에서도 완벽하게 작동
- 🎯 **난이도 조절**: 쉬움부터 마스터까지 4단계 난이도 선택

## 🛠️ 기술 스택

### Backend
- **Java 17**: 프로그래밍 언어
- **Spring Boot 3.2.0**: 웹 애플리케이션 프레임워크
- **Spring Data JPA**: 데이터베이스 ORM
- **MariaDB**: 관계형 데이터베이스
- **Lombok**: 보일러플레이트 코드 제거

### Frontend
- **HTML5 / CSS3 / JavaScript**: 클라이언트 사이드
- **Chessboard.js**: 체스판 UI 라이브러리
- **Chess.js**: 체스 게임 로직
- **Stockfish.js**: 체스 엔진 (로컬 분석용)

### AI
- **OpenAI GPT-4o-mini**: 체스 수 분석 및 친절한 멘트 생성

## 📋 사전 요구사항

프로젝트를 실행하기 전에 다음이 설치되어 있어야 합니다:

- **Java 17 이상** (JDK)
- **Maven 3.6 이상**
- **MariaDB 10.x 이상** (또는 MySQL 8.x)
- **OpenAI API 키** ([OpenAI Platform](https://platform.openai.com/)에서 발급)

## 🚀 설치 및 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/xhdndi81/ai-chess-game.git
cd ai-chess-game
```

### 2. 데이터베이스 설정

MariaDB 또는 MySQL에 데이터베이스를 생성합니다:

```sql
CREATE DATABASE chess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chess'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chess.* TO 'chess'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 애플리케이션 설정

#### 3-1. 데이터베이스 연결 정보 설정

`src/main/resources/application.yml` 파일을 열어 데이터베이스 연결 정보를 수정합니다:

```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/chess
    username: chess
    password: your_password
    driver-class-name: org.mariadb.jdbc.Driver
```

#### 3-2. OpenAI API 키 설정

**방법 A: 로컬 설정 파일 사용 (추천)**

1. `src/main/resources/application-local.yml.example` 파일을 복사합니다:
   ```bash
   cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
   ```

2. `application-local.yml` 파일을 열어 실제 API 키를 입력합니다:
   ```yaml
   openai:
     api:
       key: your-actual-openai-api-key-here
       url: https://api.openai.com/v1/chat/completions
   ```

**방법 B: 환경변수 사용**

Windows (PowerShell):
```powershell
$env:OPENAI_API_KEY="your-actual-openai-api-key-here"
```

Linux/Mac:
```bash
export OPENAI_API_KEY="your-actual-openai-api-key-here"
```

### 4. 프로젝트 빌드

```bash
mvn clean package
```

### 5. 애플리케이션 실행

```bash
java -jar target/ai-chess-0.0.1-SNAPSHOT.jar
```

또는 Maven을 통해 직접 실행:

```bash
mvn spring-boot:run
```

### 6. 웹 브라우저에서 접속

애플리케이션이 실행되면 다음 주소로 접속합니다:

```
http://localhost:8080
```

## 📁 프로젝트 구조

```
ai-chess-game/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/chess/ai/
│   │   │       ├── AiChessApplication.java      # 메인 애플리케이션 클래스
│   │   │       ├── config/
│   │   │       │   └── AppConfig.java          # Spring 설정
│   │   │       ├── controller/
│   │   │       │   ├── AIController.java       # AI API 엔드포인트
│   │   │       │   └── UserController.java      # 사용자 API 엔드포인트
│   │   │       ├── dto/
│   │   │       │   ├── AIRequest.java          # AI 요청 DTO
│   │   │       │   └── AIResponse.java         # AI 응답 DTO
│   │   │       ├── entity/
│   │   │       │   ├── User.java               # 사용자 엔티티
│   │   │       │   └── GameHistory.java        # 게임 기록 엔티티
│   │   │       ├── repository/
│   │   │       │   ├── UserRepository.java     # 사용자 리포지토리
│   │   │       │   └── GameHistoryRepository.java # 게임 기록 리포지토리
│   │   │       └── service/
│   │   │           ├── AIService.java           # AI 서비스 로직
│   │   │           └── UserService.java         # 사용자 서비스 로직
│   │   └── resources/
│   │       ├── application.yml                  # 기본 설정 파일
│   │       ├── application-local.yml.example    # 로컬 설정 예시 파일
│   │       └── static/
│   │           ├── index.html                   # 메인 HTML 파일
│   │           ├── css/
│   │           │   └── style.css                # 스타일시트
│   │           └── js/
│   │               └── app.js                    # 클라이언트 JavaScript
│   └── test/                                     # 테스트 코드
├── ETC/
│   └── server_guide.md                          # 서버 운영 가이드
├── .gitignore                                    # Git 제외 파일 목록
├── LICENSE                                       # MIT 라이선스
├── pom.xml                                       # Maven 설정 파일
└── README.md                                     # 프로젝트 설명서 (이 파일)
```

## 🎮 사용 방법

### 게임 시작하기

1. 웹 브라우저에서 애플리케이션에 접속합니다.
2. 아이의 이름을 입력합니다.
3. 난이도를 선택합니다:
   - 🌱 **쉬움**: 처음 체스를 배우는 아이들을 위한 난이도
   - 🌟 **보통**: 기본적인 체스 규칙을 아는 아이들을 위한 난이도
   - 🔥 **어려움**: 체스를 잘 알고 있는 아이들을 위한 난이도
   - 👑 **마스터**: 최고 수준의 실력을 가진 아이들을 위한 난이도
4. "게임 시작하기!" 버튼을 클릭합니다.

### 게임 플레이

- 체스 말을 클릭하여 선택하고, 이동하고 싶은 위치를 클릭합니다.
- AI가 수를 두면 친절한 멘트와 함께 다음 수를 안내합니다.
- 게임이 끝나면 결과가 자동으로 기록됩니다.

### 게임 기록 보기

- 화면 우측 상단의 🏆 버튼을 클릭하면 자신의 게임 기록을 확인할 수 있습니다.
- 날짜, 승패 결과, 게임 수를 확인할 수 있습니다.

## 🔒 보안 및 개인정보

- **API 키 보호**: OpenAI API 키는 환경변수나 로컬 설정 파일을 통해 관리합니다.
- **로컬 설정 파일**: 실제 API 키는 `application-local.yml` 파일에 저장합니다.
- **데이터베이스**: 사용자 이름과 게임 기록만 저장되며, 개인을 식별할 수 있는 추가 정보는 저장하지 않습니다.

## 🌐 서버 배포

서버에 배포하는 방법은 `ETC/server_guide.md` 파일을 참고하세요.

### 간단한 배포 예시

```bash
# 백그라운드에서 실행
nohup java -jar ai-chess-0.0.1-SNAPSHOT.jar --server.port=7777 > chess.log 2>&1 &

# 서버 종료
pkill -f ai-chess
```

## 🤝 기여하기

프로젝트 개선을 위한 기여를 환영합니다! 다음과 같이 기여할 수 있습니다:

1. 이 저장소를 Fork합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`).
5. Pull Request를 생성합니다.

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참고하세요.

## 👨‍👩‍👧‍👦 제작자

소희, 선우 아빠 ❤️

## 🙏 감사의 말

- [Chessboard.js](https://chessboardjs.com/) - 아름다운 체스판 UI 제공
- [Chess.js](https://github.com/jhlywa/chess.js) - 체스 게임 로직 라이브러리
- [OpenAI](https://openai.com/) - GPT API 제공
- [Spring Boot](https://spring.io/projects/spring-boot) - 강력한 웹 프레임워크

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 [Issues](https://github.com/xhdndi81/ai-chess-game/issues)를 통해 등록해주세요.

---

**즐거운 체스 게임 되세요! ♟️**

