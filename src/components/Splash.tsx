// 앱을 열 때 잠깐 보이는 로고 화면 (약 1.2초, 같은 실행 중에는 한 번만)

const bubbles = [
  { left: "22%", size: 10, delay: "0s" },
  { left: "70%", size: 14, delay: "0.15s" },
  { left: "48%", size: 8, delay: "0.3s" },
  { left: "84%", size: 7, delay: "0.05s" },
  { left: "12%", size: 6, delay: "0.4s" },
];

// 페이지 그리기 전에 실행: 이미 본 세션이면 숨김 + iOS에서 :active 터치 효과 켜기
const script = `try{if(sessionStorage.getItem('dt-splash'))document.documentElement.classList.add('no-splash');else sessionStorage.setItem('dt-splash','1')}catch(e){}document.addEventListener('touchstart',function(){},{passive:true});`;

export default function Splash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <div className="splash" aria-hidden>
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="splash-bubble"
            style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
          />
        ))}
        <div className="splash-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.webp" alt="" width={260} height={75} fetchPriority="high" decoding="sync" />
          <span className="splash-shine" />
        </div>
      </div>
    </>
  );
}
