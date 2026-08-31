import './globals.css';

export const metadata = {
  title: 'runs-on.dev — free subdomains',
  description: 'Claim your own name.runs-on.dev in seconds. Free, forever.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
