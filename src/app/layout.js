import './globals.css';

export const metadata = {
  title: 'SweetSalt — Inventory & Bahan Baku Tracker',
  description: 'Aesthetic raw material stock, order warning and usage monitoring tool optimized for SweetSalt bakery business.',
  keywords: 'sweet salt, bahan baku, inventory tracker, bakery inventory, vercel dashboard',
  authors: [{ name: 'SweetSalt Dev' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <main className="container" id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
