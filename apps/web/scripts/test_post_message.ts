/**
 * scripts/test_post_message.ts
 * 測試 POST /api/chat/[roomId]/message 端點
 */



async function main() {
  const roomId = "cmq0cod2y000fumvyyfnndsle";
  const urls = [
    { name: "GET Chatroom", url: `http://localhost:3000/api/chat/${roomId}`, method: "GET", body: null },
    { name: "POST Message", url: `http://localhost:3000/api/chat/${roomId}/message`, method: "POST", body: { content: "test" } },
    { name: "POST Blind Choice", url: `http://localhost:3000/api/chat/${roomId}/blind-choice`, method: "POST", body: { choice: "KEEP" } }
  ];

  for (const item of urls) {
    console.log(`\n--- Testing ${item.name} (${item.method}) ---`);
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: item.body ? JSON.stringify(item.body) : null,
      });

      console.log(`Response status: ${res.status}`);
      console.log(`Response content-type: ${res.headers.get("content-type")}`);
      const text = await res.text();
      console.log(`Response body (first 300 chars):\n${text.substring(0, 300)}`);
    } catch (err) {
      console.error(`Error with ${item.name}:`, err);
    }
  }
}

main();
