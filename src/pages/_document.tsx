import { Html, Head, Main, NextScript } from "next/document";
import { ThemeProvider } from "@/components/theme-provider";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/shadow.ico" />
        <meta name="description" content="Utilizando nossos serviços você garante segurança e inovação." />
        <link rel="manifest" href="/manifest.json" />
        </Head>
      <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
        <Main />
        <NextScript />
          </ThemeProvider>
      </body>
    </Html>
  );
}
