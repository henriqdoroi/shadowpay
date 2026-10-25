/**
 * Layout das páginas públicas de texto (Termos de uso, Privacidade).
 * Sem login e sem menu: abrem pelo cadastro e pelo checkout do comprador.
 */
import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = { title: string; body: ReactNode };

export function LegalPage({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <Head>
        <title>{`ShadowPay — ${title}`}</title>
      </Head>
      <div className="min-h-screen w-full bg-[#F6F8FB] px-4 py-10 sm:py-14">
        <article
          className="mx-auto w-full max-w-3xl rounded-xl bg-white px-5 py-8 sm:px-10 sm:py-10"
          style={{ border: "1px solid #ECECF0", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}
        >
          <div
            role="img"
            aria-label="ShadowPay"
            className="mb-6 h-12 w-[178px]"
            style={{
              backgroundImage: "url(/logo-menu-white.jpg)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "left center",
            }}
          />
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
          <p className="mt-1 text-[12.5px] text-slate-400">Atualizado em {updatedAt}</p>
          <div className="mt-6 text-[14.5px] leading-relaxed text-slate-600">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.title} className="mt-7">
              <h2 className="text-[16px] font-bold text-slate-900">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-2 space-y-2 text-[14.5px] leading-relaxed text-slate-600">{s.body}</div>
            </section>
          ))}
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-[13px]">
            <Link href="/termos" className="font-medium text-violet-600 hover:text-violet-700">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="font-medium text-violet-600 hover:text-violet-700">
              Política de privacidade
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
