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
import { resolveLocaleFromCookie, getRootMetadata, LOCALE_COOKIE_NAME } from "@/lib/i18n/metadata";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('camaleon-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  var root = document.documentElement;
                  root.classList.remove('dark', 'light');
                  root.classList.add(theme);
                  var locale = localStorage.getItem('camaleon-locale');
                  if (locale === 'en' || locale === 'es') {
                    document.documentElement.lang = locale;
                  } else {
                    document.documentElement.lang = 'es';
                  }
                  document.cookie = 'camaleon-locale=' + (locale === 'en' || locale === 'es' ? locale : 'es') + '; path=/; max-age=31536000; SameSite=Lax';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <I18nProvider>
          <ThemeProvider>
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
