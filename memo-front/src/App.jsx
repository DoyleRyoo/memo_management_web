import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// 백엔드 API 서버의 기본 주소 (이 주소로 데이터를 넣고 빼고 합니다)
const API_URL = 'http://localhost:5000/memos';

// =======================================================================
// [유틸리티 함수] 현재 날짜와 시간을 "YYYY-MM-DD HH:mm" 형식으로 만들어주는 함수
// =======================================================================
const getFormattedCurrentTime = () => {
  const now = new Date(); // 현재 시간 객체 생성
  
  // Intl.DateTimeFormat은 자바스크립트 내장 기능으로, 날짜를 원하는 형태로 깔끔하게 정렬해줍니다.
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',   // 년도 (4자리)
    month: '2-digit',  // 월 (2자리, 예: 05)
    day: '2-digit',    // 일 (2자리, 예: 20)
    hour: '2-digit',   // 시 (2자리)
    minute: '2-digit', // 분 (2자리)
    hour12: false,     // 오전/오후 표시 없이 24시간 형식으로 설정
  })
    .format(now)                  // 위 조건으로 현재 시간을 문자열로 변환 (예: "2026. 05. 20. 17:00")
    .replace(/\. /g, '-')        // 점과 공백(". ") 부분을 하이픈("-")으로 변경
    .replace('.', '');            // 마지막에 남는 점(".") 하나를 제거하여 "2026-05-20 17:00" 완성
};

// =======================================================================
// [하위 컴포넌트] MemoCard: 메모 한 장 한 장을 그려주는 컴포넌트
// =======================================================================
// React.memo로 감싸주면, 이 메모 카드의 내용(props)이 바뀌지 않는 한
// 화면이 다시 그려지지(리렌더링) 않아서 웹 페이지 속도가 훨씬 빨라집니다.
const MemoCard = memo(({ memo: item, searchQuery, highlightText, onToggle, onDelete }) => {
  return (
    <div
      // 중요 메모(item.important)이면 노란색 테두리와 노란 배경을, 아니면 일반 흰색 배경을 보여줍니다.
      className={`p-5 border rounded-xl shadow-sm transition duration-150 ${
        item.important ? 'border-yellow-300 bg-yellow-50/20' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Tailwind CSS의 grid를 사용해 내부 레이아웃을 12칸으로 쪼개어 배치합니다 */}
      <div className="grid grid-cols-12 gap-2">
        
        {/* 1) 별 아이콘 구역 (12칸 중 1칸 차지) */}
        <div className="col-span-1 flex justify-start items-start pt-1">
          <span className="text-2xl leading-none select-none">
            {item.important ? '⭐' : '☆'}
          </span>
        </div>

        {/* 2) 본문 내용 및 버튼 구역 (12칸 중 11칸 차지) */}
        <div className="col-span-11 flex flex-col items-start w-full">
          
          {/* 타이틀 영역 */}
          <div className="flex items-center justify-between w-full pb-2">
            <h3 className="text-lg font-bold text-gray-800 text-left truncate">
              {/* 검색어와 일치하는 단어가 있다면 파란색 하이라이트를 먹여서 제목을 보여줍니다 */}
              {highlightText(item.title, searchQuery)}
            </h3>
            {item.important && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                중요
              </span>
            )}
          </div>

          {/* 중간 구분선 */}
          <div className="border-b border-gray-100 w-full mb-3"></div>

          {/* 메모 내용 영역 */}
          <p className="text-gray-600 text-sm whitespace-pre-wrap break-all leading-relaxed text-left w-full mb-4">
            {/* 내용에도 검색어 하이라이트 적용 */}
            {highlightText(item.content, searchQuery)}
          </p>

          {/* 하단 영역 (작성일과 버튼들을 양 끝으로 정렬 배치) */}
          <div className="flex items-center justify-between w-full mt-1">
            
            {/* 좌측: 작성일 표시 */}
            <span className="text-xs text-gray-400 font-medium">
              {item.createdAt ? `작성일: ${item.createdAt}` : ''}
            </span>

            {/* 우측: 변경 및 삭제 버튼 그룹 */}
            <div className="flex items-center gap-2">
              {/* 중요 상태 변경 버튼 */}
              <button
                onClick={() => onToggle(item.id)} // 클릭 시 메인에서 넘어온 중요 토글 함수 실행
                className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-md border transition duration-150 ${
                  item.important
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{item.important ? '⭐' : '☆'}</span> 변경
              </button>
              
              {/* 메모 삭제 버튼 */}
              <button
                onClick={() => onDelete(item.id)} // 클릭 시 메인에서 넘어온 삭제 함수 실행
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-md bg-red-500 text-white hover:bg-red-600 transition duration-150 shadow-sm"
              >
                삭제
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});

// React.memo를 쓸 때 개발자 도구에서 컴포넌트 이름을 이쁘게 보기 위해 지정해줍니다.
MemoCard.displayName = 'MemoCard';


// =======================================================================
// [메인 컴포넌트] App: 애플리케이션의 메인 컨트롤러
// =======================================================================
export default function App() {
  // -----------------------------------------------------------------------
  // 1. 상태(State) 및 Ref 정의
  // -----------------------------------------------------------------------
  const [memos, setMemos] = useState([]);                 // 서버에서 가져온 전체 메모 배열 저장소
  const [inputTitle, setInputTitle] = useState('');       // 사용자가 입력 중인 제목 창의 텍스트
  const [inputContent, setInputContent] = useState('');     // 사용자가 입력 중인 내용 창의 텍스트
  const [showOnlyImportant, setShowOnlyImportant] = useState(false); // "중요 메모만 보기" 체크박스 상태
  const [searchQuery, setSearchQuery] = useState('');     // 사용자가 입력한 검색 단어
  const [isSearchOpen, setIsSearchOpen] = useState(false); // 검색창이 옆으로 길게 열려있는지 여부

  // useRef는 DOM 요소에 직접 접근할 때 씁니다. 여기서는 "검색창 영역"을 통째로 가리키기 위해 썼습니다.
  const searchRef = useRef(null);

  // -----------------------------------------------------------------------
  // 2. 외부 이벤트 바인딩: 검색창 바깥 영역을 클릭하면 검색창을 닫아주는 로직
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      // searchRef(검색창)가 존재하고, 마우스로 누른 곳(event.target)이 검색창 안쪽이 '아니며', 현재 검색창이 열려있다면!
      if (searchRef.current && !searchRef.current.contains(event.target) && isSearchOpen) {
        setIsSearchOpen(false); // 검색창을 접고
        setSearchQuery('');    // 검색어 내용도 지워줍니다.
      }
    };

    // 마우스 클릭 이벤트 등록
    document.addEventListener('mousedown', handleClickOutside);
    // 컴포넌트가 사라지거나 재작동할 때 기존 이벤트를 깨끗이 지워줍니다 (메모리 누수 방지)
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // -----------------------------------------------------------------------
  // 3. 백엔드 API 서버와 통신하는 함수들 (useCallback으로 메모리 최적화)
  // -----------------------------------------------------------------------
  // useCallback을 감싸주면, 리렌더링이 일어나도 이 함수들이 컴퓨터 메모리에 저장되어 계속 재사용됩니다.
  
  // API: 서버에서 메모 데이터 전체 가져오기
  const fetchMemos = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const data = await response.json();
      setMemos(data); // 서버에서 받은 소중한 메모 데이터를 상태값에 저장
    } catch (error) {
      console.error('실패:', error);
      alert('서버로부터 메모를 가져오지 못했습니다.');
    }
  }, []); // 빈 배열 []은 App이 처음 켜질 때 딱 한 번만 이 함수를 만들겠다는 뜻입니다.

  // App 컴포넌트가 브라우저 화면에 처음 나타날 때(로드될 때) 자동으로 메모 목록을 가져옵니다.
  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // API: 새로운 메모를 서버에 저장하기
  const handleAddMemo = useCallback(async (e) => {
    if (e) e.preventDefault(); // form 태그의 새로고침 성질을 강제로 막아줍니다.
    
    // 제목이나 내용이 텅 비어있다면 경고창을 띄우고 중단합니다.
    if (!inputTitle.trim() || !inputContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요!");
      return;
    }

    const createdAtFormatted = getFormattedCurrentTime(); // 유틸 함수를 통해 포맷된 시간 문자열 생성

    try {
      const response = await fetch(API_URL, {
        method: 'POST', // 데이터 추가 요청
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputTitle,
          content: inputContent,
          createdAt: createdAtFormatted, // 작성 시간도 함께 보냅니다.
        }),
      });
      if (!response.ok) throw new Error('메모 추가 실패');
      
      await fetchMemos();    // 최신 서버 데이터를 다시 받아와서 화면 갱신
      setInputTitle('');    // 입력창 비우기
      setInputContent('');  // 내용창 비우기
    } catch (error) {
      console.error(error);
    }
    // 이 함수 안에서 inputTitle과 inputContent의 최신 값을 사용해야 하므로 의존성 배열에 넣어줍니다.
  }, [inputTitle, inputContent, fetchMemos]);

  // API: 메모의 중요(⭐) 상태를 변경하기
  const handleToggleImportant = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'PATCH' }); // 특정 아이디의 일부분만 수정 요청
      if (!response.ok) throw new Error('중요 상태 변경 실패');
      await fetchMemos(); // 화면 갱신
    } catch (error) {
      console.error(error);
    }
  }, [fetchMemos]);

  // API: 메모 삭제하기
  const handleDeleteMemo = useCallback(async (id) => {
    if (!window.confirm('정말 이 메모를 삭제하시겠습니까?')) return; // 취소를 누르면 실행 안 함
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' }); // 특정 아이디 삭제 요청
      if (!response.ok) throw new Error('메모 삭제 실패');
      await fetchMemos(); // 화면 갱신
    } catch (error) {
      console.error(error);
    }
  }, [fetchMemos]);

  // 내용 입력 중 엔터를 누르면 자동으로 저장해주는 편리한 기능
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) return; // Shift + Enter 조합은 줄바꿈 기능이므로 그냥 넘어갑니다.
      e.preventDefault();     // 엔터키 본래의 줄바꿈 기능을 막고
      handleAddMemo();        // 메모 저장 함수 실행!
    }
  };

  // -----------------------------------------------------------------------
  // 4. 연산 최적화: useMemo를 활용한 데이터 필터링 (중요 필터 및 실시간 검색)
  // -----------------------------------------------------------------------
  // 글자를 한 자 입력할 때마다 전체 데이터를 무식하게 다 뒤지면 느려집니다.
  // useMemo를 사용하면 memos, showOnlyImportant, searchQuery 세 가지가 바뀔 때만 이 필터링 수학 연산을 수행합니다.
  const displayedMemos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim(); // 검색어를 소문자로 바꾸고 앞뒤 공백 제거
    
    return memos.filter((memoItem) => {
      // 조건 1: "중요 메모만 보기"가 체크되어 있으면 중요(important)한 것만 통과, 꺼져있으면 전부 통과!
      const matchImportant = showOnlyImportant ? memoItem.important : true;
      
      // 조건 2: 검색어가 없으면 전부 통과, 있으면 제목이나 내용에 검색어가 포함된 메모만 통과!
      const matchQuery = !query || 
        memoItem.title.toLowerCase().includes(query) ||
        memoItem.content.toLowerCase().includes(query);
      
      return matchImportant && matchQuery; // 두 조건이 모두 참인 메모만 최종 리스트에 남습니다.
    });
  }, [memos, showOnlyImportant, searchQuery]);

  // -----------------------------------------------------------------------
  // 5. 하이라이팅 기능 (검색된 글자에 파란색 배경 입히기)
  // -----------------------------------------------------------------------
  const highlightText = useCallback((text, highlight) => {
    if (!highlight.trim()) return text; // 검색어가 없으면 원본 텍스트 그대로 반환
    
    // 특수문자가 검색어에 섞여 들어왔을 때 에러가 나지 않도록 이스케이프 처리를 해줍니다.
    const smokyHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${smokyHighlight})`, 'gi'); // 정규식 패턴 생성 (g: 전체 검색, i: 대소문자 무시)
    const parts = text.split(regex); // 검색어를 기준으로 글자를 쪼갭니다.

    // 쪼개진 글자 배열을 돌면서 검색어와 일치하는 부분만 <span> 태그로 묶어 파란색 배경 스타일을 줍니다.
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-blue-100 text-blue-800 font-semibold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  }, []);

  // -----------------------------------------------------------------------
  // 6. UI 렌더링 (HTML과 유사한 JSX 문법 구역)
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        
        {/* 헤더 영역 */}
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">📝 풀스택 메모장</h1>
        </header>

        {/* 메모 입력 폼 구역 */}
        <form onSubmit={handleAddMemo} className="space-y-5 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div className="flex flex-col items-start">
            <label className="text-sm font-semibold text-gray-600 mb-1.5">제목</label>
            <input
              type="text"
              placeholder="메모 제목을 입력하세요"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)} // 글자를 타이핑할 때마다 상태값 변경
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col items-start">
            <label className="text-sm font-semibold text-gray-600 mb-1.5">내용</label>
            <textarea
              placeholder="메모 내용을 입력하세요"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)} // 글자를 타이핑할 때마다 상태값 변경
              onKeyDown={handleKeyDown} // 키보드를 누를 때 작동하는 이벤트 핸들러 연결
              rows="4"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
            >
              메모 추가
            </button>
          </div>
        </form>

        {/* 필터 및 검색 제어 구역 */}
        <div className="flex items-center justify-between mb-6 bg-gray-50/50 p-3 rounded-lg px-4 gap-2 min-h-[56px]">
          {/* 현재 조건에 의해 필터링되어 화면에 보이는 메모의 개수를 실시간으로 표시 */}
          <span className="text-sm text-gray-500 font-medium shrink-0">
            총 <span className="text-blue-600 font-bold">{displayedMemos.length}</span>개의 메모
          </span>

          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* 돋보기 검색 바깥 감지용 Ref 바인딩 */}
            <div ref={searchRef} className="flex items-center justify-end">
              {/* isSearchOpen 상태에 따라 서서히 가로길이가 늘어나는 애니메이션 구현 (w-9 -> w-60) */}
              <div className={`flex items-center bg-white border border-gray-200 rounded-md transition-all duration-300 shadow-sm overflow-hidden h-9 ${
                isSearchOpen ? 'w-60 px-2.5' : 'w-9 justify-center cursor-pointer hover:bg-gray-100'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen); // 토글 열기/닫기
                    if (isSearchOpen) setSearchQuery(''); // 검색창 닫힐 때 단어 리셋
                  }}
                  className="text-gray-500 text-sm focus:outline-none shrink-0 p-1 flex items-center justify-center"
                >
                  🔍
                </button>

                {/* 검색창이 열려있을 때만 input 태그가 화면에 그려집니다 */}
                {isSearchOpen && (
                  <input
                    type="text"
                    placeholder="제목, 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-sm focus:outline-none w-full ml-1.5 h-full"
                    autoFocus // 열리자마자 바로 글자를 칠 수 있게 포커스 주기
                  />
                )}
              </div>
            </div>

            {/* 중요 메모 필터 토글 체크박스 */}
            <label className="inline-flex items-center cursor-pointer select-none shrink-0 pl-1">
              <input
                type="checkbox"
                checked={showOnlyImportant}
                onChange={(e) => setShowOnlyImportant(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mr-1.5"
              />
              <span className="text-sm text-gray-600 font-semibold">⭐ 중요 메모만</span>
            </label>
          </div>
        </div>

        {/* 메모 목록 출력 구역 */}
        <div className="space-y-4">
          {displayedMemos.length === 0 ? (
            // 조건에 맞는 메모가 단 한개도 없을 때 띄워줄 안내판
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
              <p className="text-gray-400 text-lg font-medium">
                {searchQuery ? '검색 결과에 맞는 메모가 없습니다.' : '메모해주세요!'}
              </p>
            </div>
          ) : (
            // 최종 필터링된 배열(displayedMemos)을 .map 함수를 통해 하나씩 꺼내어 메모 카드로 뿌려줍니다.
            displayedMemos.map((memoItem) => (
              <MemoCard
                key={memoItem.id} // 리액트가 목록을 효율적으로 기억하기 위해 필수적인 교유한 키 값
                memo={memoItem}   // 개별 메모 데이터 객체 전달
                searchQuery={searchQuery}
                highlightText={highlightText}
                onToggle={handleToggleImportant} // 메모카드가 사용할 기능들 전달
                onDelete={handleDeleteMemo}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}