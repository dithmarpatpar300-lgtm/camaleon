import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { I18nProvider } from "@/providers/I18nProvider";
import { TransmutationWorkerProvider } from "@/providers/TransmutationWorkerProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OverlayScrollbar } from "@/components/layout/OverlayScrollbar";
import { getRootMetadata, LOCALE_COOKIE_NAME } from "@/lib/i18n/metadata";
import {
  PREFERENCES_BOOTSTRAP_SCRIPT,
  resolveLocaleFromCookie,
  resolveThemeFromCookie,
  THEME_COOKIE_NAME,
} from "@/lib/prefs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return getRootMetadata(locale);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocaleFromCookie(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value
  );
  const initialTheme = resolveThemeFromCookie(
    cookieStore.get(THEME_COOKIE_NAME)?.value
  );

  return (
    <html
      lang={initialLocale}
      className={initialTheme}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <I18nProvider initialLocale={initialLocale}>
          <ThemeProvider initialTheme={initialTheme}>
            <OverlayScrollbar />
            <TransmutationWorkerProvider>
              <ToastProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToastProvider>
            </TransmutationWorkerProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
