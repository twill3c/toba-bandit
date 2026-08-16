import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "toba-bandit — バンディット賭場",
  description:
    "当たり確率が隠された 5 台のスロットを ε-greedy・UCB1・Thompson サンプリングが打ち続け、累積後悔のレースで探索と活用のトレードオフを見せる教材アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
