import "./globals.css";

export const metadata = {
  title: "WC 2026 Tahmin Yarışması",
  description: "Dünya Kupası 2026 grup maçları tahmin oyunu",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="max-w-[520px] mx-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
