const qrForm = document.getElementById('qrForm');
const urlInput = document.getElementById('urlInput');
const errorMsg = document.getElementById('errorMsg');
const qrCard = document.getElementById('qrCard');
const qrCanvas = document.getElementById('qrCanvas');
const qrUrlDisplay = document.getElementById('qrUrlDisplay');
const logoLink = document.getElementById('logoLink');

let currentUrl = '';

/**
 * 입력된 문자열을 보정하여 유효한 URL 형태로 반환합니다.
 */
function normalizeUrl(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Canvas에 고해상도 QR 코드를 그립니다 (JPG 저장을 위해 흰색 배경 채움).
 */
function renderQrToCanvas(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const canvasSize = 640; // 고해상도 JPG 출력을 위한 내부 캔버스 크기
  const marginModules = 3;
  const totalModules = moduleCount + marginModules * 2;
  const cellSize = canvasSize / totalModules;

  qrCanvas.width = canvasSize;
  qrCanvas.height = canvasSize;

  const ctx = qrCanvas.getContext('2d');

  // JPG는 투명도를 지원하지 않으므로 흰색 배경을 먼저 칠함
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = '#000000';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = Math.floor((col + marginModules) * cellSize);
        const y = Math.floor((row + marginModules) * cellSize);
        const w = Math.ceil((col + marginModules + 1) * cellSize) - x;
        const h = Math.ceil((row + marginModules + 1) * cellSize) - y;
        ctx.fillRect(x, y, w, h);
      }
    }
  }
}

/**
 * 캔버스의 QR 코드를 JPG 파일로 다운로드합니다.
 */
function downloadQrAsJpg() {
  if (!currentUrl) return;

  const dataUrl = qrCanvas.toDataURL('image/jpeg', 0.98);
  const link = document.createElement('a');

  // URL 호스트명을 파일명에 반영
  let fileName = 'qrcode.jpg';
  try {
    const parsed = new URL(currentUrl);
    const host = parsed.hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    if (host) {
      fileName = `qr-${host}.jpg`;
    }
  } catch (_) {
    // 기본 파일명 유지
  }

  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// URL 입력 확인 이벤트
qrForm.addEventListener('submit', (e) => {
  e.preventDefault();
  errorMsg.textContent = '';

  const raw = urlInput.value;
  if (!raw.trim()) {
    errorMsg.textContent = 'URL을 입력해 주세요.';
    urlInput.focus();
    return;
  }

  const finalUrl = normalizeUrl(raw);

  try {
    renderQrToCanvas(finalUrl);
    currentUrl = finalUrl;
    qrUrlDisplay.textContent = finalUrl;

    // 입력창을 하단으로 내리고 중앙에 QR코드 표시
    document.body.classList.add('has-qr');
  } catch (err) {
    errorMsg.textContent = 'QR 코드 생성 중 오류가 발생했습니다. URL 길이를 확인해 주세요.';
  }
});

// QR 코드 클릭 시 JPG 다운로드
qrCard.addEventListener('click', downloadQrAsJpg);
qrCard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    downloadQrAsJpg();
  }
});

// 좌측 상단 로고 클릭 시 처음 화면(../index.html)으로 이동
logoLink.addEventListener('click', () => {
  location.href = '../index.html';
});

// 마우스 커서 위치에 따른 부드러운 그라데이션 & 색상 변화
const rootStyle = document.documentElement.style;
let targetX = 0.5;
let targetY = 0.5;
let currentX = 0.5;
let currentY = 0.5;

window.addEventListener('mousemove', (e) => {
  targetX = e.clientX / window.innerWidth;
  targetY = e.clientY / window.innerHeight;
});

function animateGradient() {
  // 부드러운 보간 (Lerp)
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  const xPercent = (currentX * 100).toFixed(2);
  const yPercent = (currentY * 100).toFixed(2);
  const secXPercent = (100 - currentX * 100).toFixed(2);
  const secYPercent = (100 - currentY * 100).toFixed(2);

  // 로고의 옐로우 톤과 어울리는 따뜻한 색상(레몬 옐로우 ~ 골든 앰버 ~ 피치 코랄) 범위에서 미세 변화
  const hue1 = Math.round(36 + currentX * 22); // 36°(앰버) ~ 58°(밝은 레몬 옐로우)
  const light1 = Math.round(70 + currentY * 10); // 70% ~ 80%
  const hue2 = Math.round(18 + (1 - currentY) * 28); // 18°(피치 코랄) ~ 46°(골드)
  const angle = Math.round(115 + (currentX - 0.5) * 50);

  rootStyle.setProperty('--mouse-x', `${xPercent}%`);
  rootStyle.setProperty('--mouse-y', `${yPercent}%`);
  rootStyle.setProperty('--sec-x', `${secXPercent}%`);
  rootStyle.setProperty('--sec-y', `${secYPercent}%`);
  rootStyle.setProperty('--spot-color-1', `hsla(${hue1}, 100%, ${light1}%, 0.65)`);
  rootStyle.setProperty('--spot-color-2', `hsla(${hue2}, 100%, 78%, 0.55)`);
  rootStyle.setProperty('--base-angle', `${angle}deg`);

  requestAnimationFrame(animateGradient);
}

requestAnimationFrame(animateGradient);
