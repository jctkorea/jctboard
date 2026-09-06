import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "불판몰 고객센터",
  description: "불판몰 고객 문의 게시판",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
