import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Script from 'next/script'
import { CartProvider } from './context/CartContext'
import { Toaster } from 'react-hot-toast'
import ConditionalLayout from './components/global/ConditionalLayout'
import AffiliateTrackingProvider from './components/global/AffiliateTrackingProvider'

const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <CartProvider>
          <AffiliateTrackingProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AffiliateTrackingProvider>
          <Toaster position="top-right" />
        </CartProvider>
        {googleClientId ? (
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
          />
        ) : null}
        <Script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" />
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" />
      </body>
    </html>
  );
}
