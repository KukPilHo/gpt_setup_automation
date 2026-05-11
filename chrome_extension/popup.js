document.getElementById('startBtn').addEventListener('click', async () => {
  const data = document.getElementById('dataInput').value.trim();
  if (!data) return alert("데이터를 입력해주세요.");
  
  const lines = data.split('\n').filter(line => line.trim() !== '');
  const tasks = lines.map(line => {
    // 탭(\t) 또는 다중 공백으로 분리
    const parts = line.split(/[\t\s]+/).filter(p => p.trim() !== '');
    let email = parts[0];
    let gpt = parts.length > 1 ? parts[1] : null;
    return { email, gpt: gpt ? gpt.split('@')[0] : null };
  }).filter(t => t.email && t.gpt);

  if (tasks.length === 0) return alert("유효한 데이터가 없습니다. (형식: 이메일 띄어쓰기 그룹ID)");

  document.getElementById('status').innerText = `총 ${tasks.length}명 작업 시작...`;
  document.getElementById('startBtn').disabled = true;

  // 백그라운드 스크립트로 작업 전달
  chrome.runtime.sendMessage({ action: "startJobs", tasks: tasks }, (response) => {
    if(response && response.status === "done") {
       document.getElementById('status').innerText += "\n\n🎉 모든 작업 완료!";
       document.getElementById('startBtn').disabled = false;
    }
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateStatus") {
    document.getElementById('status').innerText = msg.text;
  }
});
