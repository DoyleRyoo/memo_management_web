// ==========================================
// 1. 필수 모듈 불러오기 (Import Modules)
// ==========================================
const express = require('express'); // Node.js 환경에서 가장 많이 쓰이는 웹 프레임워크
const cors = require('cors');       // 다른 도메인(예: React의 3000번 포트)에서 이 서버로 요청할 수 있도록 허용해주는 보안 미들웨어

const app = express();
const PORT = 5000; // 서버가 열릴 포트 번호

// ==========================================
// 2. 미들웨어 설정 (Middleware Setup)
// ==========================================
app.use(cors());          // 모든 도메인으로부터의 자원 공유(CORS)를 허용
app.use(express.json());  // 클라이언트가 보낸 JSON 형식의 본문(body)을 JavaScript 객체로 파악할 수 있게 해줌

// ==========================================
// 헬퍼 함수: 한국 시간(KST) 기준 "YYYY-MM-DD HH:mm" 포맷팅
// ==========================================
const formatCurrentDate = () => {
  // 서버 환경에 구애받지 않고 한국 시간(UTC+9)을 일관되게 생성
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);

  const year = kstDate.getUTCFullYear();
  // 월과 일, 시, 분이 1자리 수일 때 앞에 0을 붙여 포맷을 통일합니다.
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// ==========================================
// 3. 메모리 데이터 저장소 (In-Memory Database)
// ==========================================
// [구조 변경] 기존 더미 데이터에도 'createdAt' 필드를 추가하여 일관성을 맞춥니다.
let memos = [
  { id: 1, title: "React 공부", content: "useEffect 정리하기", important: false, createdAt: "2026-05-20 14:30" },
  { id: 2, title: "Tailwind CSS", content: "유틸리티 클래스 익히기", important: true, createdAt: "2026-05-20 15:10" }
];

// 고유한 ID 값을 생성하기 위한 변수
let nextId = 3;

// ==========================================
// 4. REST API 엔드포인트 라우팅 (API Routes)
// ==========================================

/**
 * [GET] /memos
 * 역할: 전체 메모 목록 조회 (생성일이 추가된 배열이 반환됨)
 */
app.get('/memos', (req, res) => {
  res.status(200).json(memos);
});

/**
 * [POST] /memos
 * 역할: 새로운 메모 추가
 * 요청 본문(body): { title, content }
 */
app.post('/memos', (req, res) => {
  const { title, content } = req.body;

  // 예외 처리: 제목이나 내용이 비어있으면 400(잘못된 요청) 에러를 반환
  if (!title || !content) {
    return res.status(400).json({ message: "제목과 내용을 모두 입력해주세요." });
  }

  // [기능 추가] 새로운 메모 객체 생성 시 현재 시각을 포맷팅하여 주입
  const newMemo = {
    id: nextId++, 
    title: title,
    content: content,
    important: false,
    createdAt: formatCurrentDate() // 예: "2026-05-20 16:53"
  };

  memos.push(newMemo);

  // 211번 생성됨(Created) 상태 코드와 함께 새로 만든 메모를 반환
  res.status(201).json(newMemo);
});

/**
 * [PATCH] /memos/:id
 * 역할: 특정 메모의 중요(important) 상태 토글 변경
 * 비고: 상태 변경 시 기존 createdAt 날짜는 그대로 유지됩니다.
 */
app.patch('/memos/:id', (req, res) => {
  const memoId = parseInt(req.params.id, 10);
  const memo = memos.find(m => m.id === memoId);

  if (!memo) {
    return res.status(404).json({ message: "해당 메모를 찾을 수 없습니다." });
  }

  memo.important = !memo.important;

  res.status(200).json(memo);
});

/**
 * [DELETE] /memos/:id
 * 역할: 특정 메모 삭제
 */
app.delete('/memos/:id', (req, res) => {
  const memoId = parseInt(req.params.id, 10);
  const memoIndex = memos.findIndex(m => m.id === memoId);

  if (memoIndex === -1) {
    return res.status(404).json({ message: "해당 메모를 찾을 수 없습니다." });
  }

  memos.splice(memoIndex, 1);

  res.status(200).json({ message: "메모가 성공적으로 삭제되었습니다." });
});

// ==========================================
// 5. 서버 실행 (Start Server)
// ==========================================
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` 시니어 개발자의 메모 관리 서버가 구동되었습니다.`);
  console.log(` 실행 중인 포트: http://localhost:${PORT}/memos`);
  console.log(`=========================================`);
});