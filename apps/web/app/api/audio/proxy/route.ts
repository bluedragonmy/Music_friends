import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // 發送請求到目標音訊網址，偽造 Headers 繞過網易雲的防盜鏈與地區限制
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://music.163.com/",
        "Accept-Encoding": "identity",
      },
    });

    if (!response.ok) {
      console.error(`[Audio Proxy] Failed to fetch target url ${url}, status: ${response.status}`);
      return NextResponse.json({ error: "Failed to fetch audio stream" }, { status: response.status });
    }

    // 設定串流 Headers
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "audio/mpeg");
    headers.set("Cache-Control", "public, max-age=86400"); // 快取 24 小時

    // 返回音訊串流給前端
    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[Audio Proxy Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
