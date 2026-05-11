chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startJobs") {
    processJobs(request.tasks).then(() => {
      sendResponse({ status: "done" });
    });
    return true; // 비동기 응답 대기
  }
});

async function processJobs(tasks) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const url = `https://groups.google.com/a/ablearn.kr/g/${task.gpt}/members`;
    
    chrome.runtime.sendMessage({ action: "updateStatus", text: `[${i+1}/${tasks.length}] ${task.email} 님을 ${task.gpt} 에 추가 중...` });

    // 탭 생성
    const tab = await chrome.tabs.create({ url: url, active: true });

    // 탭 로딩 완료 대기
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 2000); // 로딩 후 2초 안정화
        }
      });
    });

    // 화면 자동화 스크립트 실행
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // 스크립트에 이메일 전달 후 끝날 때까지 대기
      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "runAddMember", email: task.email }, (res) => {
          resolve(res);
        });
      });
    } catch(e) {
      console.error(e);
    }
    
    // 작업 완료 후 탭 닫기
    await chrome.tabs.remove(tab.id);
    
    // 다음 사람 작업 전 1초 대기
    await new Promise(r => setTimeout(r, 1000));
  }
}
