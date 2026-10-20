const shortenForm = document.getElementById('shortenForm');
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const shortUrlOutput = document.getElementById('shortUrlOutput');
const copyBtn = document.getElementById('copyBtn');
const statusMsg = document.getElementById('statusMsg');
const logoLink = document.getElementById('logoLink');

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
 * 3-2. 입력 필드가 비어 있으면 '단축하기' 버튼을 비활성화합니다.
 */
function updateButtonState() {
  const hasValue = urlInput.value.trim().length > 0;
  shortenBtn.disabled = !hasValue;
}

urlInput.addEventListener('input', updateButtonState);

/**
 * OpenAPI(is.gd 기본, 실패 시 da.gd 백업)를 호출하여 단축 URL을 반환합니다.
 */
async function requestShortUrl(targetUrl) {
  const encodedUrl = encodeURIComponent(targetUrl);

  // 1차 시도: is.gd OpenAPI (JSON 응답, CORS 허용)
  try {
    const response = await fetch(`https://is.gd/create.php?format=json&url=${encodedUrl}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.shorturl) {
        return data.shorturl;
      }
      if (data && data.errormessage) {
        throw new Error(data.errormessage);
      }
    }
  } catch (err) {
    // 1차 OpenAPI 실패 시 2차 OpenAPI(da.gd)로 폴백
    const fallbackRes = await fetch(`https://da.gd/s?url=${encodedUrl}`);
    if (fallbackRes.ok) {
      const text = (await fallbackRes.text()).trim();
      if (text.startsWith('http')) {
        return text;
      }
    }
    throw err;
  }

  throw new Error('URL 단축 요청에 실패했습니다.');
}

/**
 * 3-3. '단축하기'를 클릭하면 'URL입력'창의 값을 OpenAPI로 요청하고 응답을 출력 상자에 표시합니다.
 */
shortenForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const rawValue = urlInput.value.trim();
  if (!rawValue) {
    updateButtonState();
    return;
  }

  const targetUrl = normalizeUrl(rawValue);

  statusMsg.classList.remove('error');
  statusMsg.textContent = 'URL을 단축하고 있습니다...';
  shortenBtn.disabled = true;

  try {
    const shortUrl = await requestShortUrl(targetUrl);
    shortUrlOutput.value = shortUrl;
    statusMsg.textContent = '단축 URL이 생성되었습니다.';
  } catch (error) {
    statusMsg.classList.add('error');
    statusMsg.textContent = 'URL 단축에 실패했습니다. 올바른 URL인지 확인해 주세요.';
  } finally {
    updateButtonState();
  }
});

/**
 * 3-4. '복사' 버튼을 클릭하면 자동으로 복사하고 '복사하였습니다' 알림창을 표시합니다.
 */
copyBtn.addEventListener('click', async () => {
  const valueToCopy = shortUrlOutput.value.trim();
  if (!valueToCopy) {
    alert('복사할 단축 URL이 없습니다.');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(valueToCopy);
    } else {
      shortUrlOutput.select();
      shortUrlOutput.setSelectionRange(0, 99999);
      document.execCommand('copy');
    }
    alert('복사하였습니다');
  } catch (_) {
    shortUrlOutput.select();
    document.execCommand('copy');
    alert('복사하였습니다');
  }
});

// 좌측 상단 로고 클릭 시 처음 화면(../index.html)으로 이동
logoLink.addEventListener('click', () => {
  location.href = '../index.html';
});

// 마우스 커서 위치에 따른 부드러운 그라데이션 애니메이션
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
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  const xPercent = (currentX * 100).toFixed(2);
  const yPercent = (currentY * 100).toFixed(2);
  const secXPercent = (100 - currentX * 100).toFixed(2);
  const secYPercent = (100 - currentY * 100).toFixed(2);

  const hue1 = Math.round(36 + currentX * 22);
  const light1 = Math.round(70 + currentY * 10);
  const hue2 = Math.round(18 + (1 - currentY) * 28);
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
