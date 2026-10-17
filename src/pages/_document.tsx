import { Html, Head, Main, NextScript } from "next/document";

// O tema (claro/escuro) é controlado só pelo ThemeProvider do _app. Havia um
// segundo aqui, com padrão "dark", que rodava primeiro e deixava o <html> com
// color-scheme escuro até no tema claro.
export default function Document() {
  return (
    <Html lang="pt-BR" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/shadow.ico" />
        <meta name="description" content="Utilizando nossos serviços você garante segurança e inovação." />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
