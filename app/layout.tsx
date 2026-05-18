import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const title = "汇率转换器 | 多货币订阅价格计算";
const description =
  "计算 ChatGPT、Claude 等 AI 订阅服务在不同货币和支付渠道下的人民币价格";
const ogImage = "/og.png";
const metadataBase = new URL("https://cc-tool.jihuayu.com/");

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: ogImage,
        width: 1731,
        height: 909,
        alt: "汇率转换器分享图：快速比较不同地区的订阅价格",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
