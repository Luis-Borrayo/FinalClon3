import Script from "next/script";
import "./globals.css";
import TemplateShell from "@/components/TemplateShell";

export const metadata = {
  title: "Ecosistema USPG",
  description: "Plataforma modular integrada — USPG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" dir="ltr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="stylesheet" href="/assets/plugins/bootstrap/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/style.min.css" />
        <Script id="uspg-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('uspg-theme');if(t==='light'&&document.body){document.body.classList.remove('dark-mode','theme-dark');}}catch(e){}})();`}
        </Script>
      </head>
      <body className="font-muli theme-blush dark-mode" suppressHydrationWarning>
        <div id="main_content">
          <TemplateShell>
            {children}
          </TemplateShell>
        </div>

        <Script src="/assets/bundles/lib.vendor.bundle.js" strategy="beforeInteractive" />
        <Script src="/assets/js/core.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
