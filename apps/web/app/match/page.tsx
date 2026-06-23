import { redirect } from "next/navigation";

export const metadata = {
  title: "Match | Ditto Music Vibe",
  description: "Discover your next music vibe match.",
};

// 真正的配對邏輯在 app/page.tsx（首頁），/match 重導向過去
export default function MatchPage() {
  redirect("/");
}
