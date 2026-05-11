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
    
    // 클립보드 붙여넣기 방식이 브라우저 자동화에서 이벤트를 가장 잘 발생시킴
    if (!document.execCommand('insertText', false, email)) {
        input.value = email;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await wait(1500);
    
    // 탭 키 발송 (칩 확정)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true }));
    await wait(1000);
    
    // 3. 하단 회원 추가 버튼 클릭 (모달 내)
    let confirmBtns = document.querySelectorAll('div[role="button"], button');
    let targetBtn = Array.from(confirmBtns).filter(b => b.innerText && b.innerText.includes("회원 추가")).pop();
    if(targetBtn) {
        targetBtn.click();
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
