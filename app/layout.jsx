import './globals.css';
import Footer from './components/Footer.jsx';

export const metadata = {
  metadataBase: new URL('https://runs-on.dev'),
  title: {
    default: 'runs-on.dev — free subdomains',
    template: '%s — runs-on.dev',
  },
  description: 'Claim your own name.runs-on.dev in seconds. Free, forever.',
  openGraph: {
    siteName: 'runs-on.dev',
    type: 'website',
    url: 'https://runs-on.dev',
    title: 'runs-on.dev — free subdomains',
    description: 'Claim your own name.runs-on.dev in seconds. Free, forever.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'runs-on.dev — free subdomains',
    description: 'Claim your own name.runs-on.dev in seconds. Free, forever.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
