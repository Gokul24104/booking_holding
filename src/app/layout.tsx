import './globals.css';

export const metadata = {
  title: 'Gas Tracker',
  description: 'Real-time gas cost simulation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">{children}</body>
    </html>
  );
}