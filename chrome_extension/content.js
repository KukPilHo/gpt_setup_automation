chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runAddMember") {
    runAddMember(request.email)
      .then(() => sendResponse({success: true}))
      .catch((e) => sendResponse({success: false, error: e.toString()}));
    return true; // 비동기 응답 처리
  }
});

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForElement(selector, timeout = 10000) {
  let elapsed = 0;
  while(elapsed < timeout) {
    let el = document.querySelector(selector);
    if (el) return el;
    await wait(500);
    elapsed += 500;
  }
  throw new Error(`Timeout waiting for ${selector}`);
}

async function runAddMember(email) {
  try {
    // 1. 회원 추가 버튼 클릭 (Codegen 추출 결과 적용)
    let addBtn = await waitForElement('[aria-label="회원 추가"]');
    addBtn.click();
    await wait(1500);
    
    // 2. 그룹 멤버 이메일 입력
    let input = await waitForElement('input[aria-label="그룹 멤버"]');
    input.focus();
    input.click();
    
    // 이메일 뒤에 콤마(,)를 붙이면 구글이 즉시 칩(Chip)으로 변환합니다. (가장 확실한 방법)
    const emailWithComma = email + ", ";
    if (!document.execCommand('insertText', false, emailWithComma)) {
        input.value = emailWithComma;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await wait(1500);
    
    // 포커스 해제(blur)로 자동완성 및 칩 생성을 완벽히 마무리
    input.blur();
    await wait(1000);
    
    // 3. 하단 회원 추가 버튼 클릭 (모달 내)
    let confirmBtns = document.querySelectorAll('div[role="button"], button');
    let targetBtn = Array.from(confirmBtns).filter(b => b.innerText && b.innerText.includes("회원 추가")).pop();
    if(targetBtn) {
        // 구글의 경우 단순 click()이 무시될 때가 있어 마우스 클릭 이벤트 전체를 쏴줍니다.
        targetBtn.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        targetBtn.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
        targetBtn.click();
    } else {
        throw new Error("모달의 회원 추가 버튼을 찾지 못했습니다.");
    }
    
    await wait(2000);
    
    // 4. 확인 팝업 (봇 차단 캡챠가 뜰 경우 사용자가 닫아야 함)
    let okBtns = document.querySelectorAll('div[role="button"], button');
    let okBtn = Array.from(okBtns).filter(b => b.innerText && b.innerText.includes("확인")).pop();
    if (okBtn) {
        okBtn.click();
        await wait(1000);
    }
    
  } catch(e) {
    console.error(e);
    throw e;
  }
}
