"use client";

// Owner-supplied HTML (their widget) inside a sandboxed iframe: scripts run but
// stay isolated from the site (no style/JS bleed).
export function PopupEmbed({ html }: { html: string }) {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:system-ui,sans-serif}</style></head>
<body>${html}</body></html>`;
  return (
    <iframe
      title="promotion"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
      className="h-[60vh] max-h-[600px] w-full border-0"
    />
  );
}
