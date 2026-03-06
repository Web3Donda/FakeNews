import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Get base URL - prioritize explicit env var, then Vercel URL, fallback to localhost
let baseUrl = process.env.NEXT_PUBLIC_APP_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Ensure we have a proper URL with https://
if (!baseUrl.startsWith('http')) {
  baseUrl = `https://${baseUrl}`;
}

const imageUrl = `${baseUrl}/twitter-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Fake News Detective - GenLayer Game",
  description: "Can you spot the fake headline? Test your skills against AI consensus on GenLayer blockchain.",
  openGraph: {
    title: "Fake News Detective - GenLayer Game",
    description: "Can you spot the fake headline? Test your skills against AI consensus on GenLayer blockchain.",
    type: "website",
    url: baseUrl,
    siteName: "Fake News Detective",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "Fake News Detective Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fake News Detective - GenLayer Game",
    description: "Can you spot the fake headline? Test your skills against AI consensus on GenLayer blockchain.",
    images: [imageUrl],
    creator: "@genlayer",
  },
};

export const viewport: Viewport = {
  themeColor: "#9B6AF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
