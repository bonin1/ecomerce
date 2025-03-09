import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Script from 'next/script'
import { CartProvider } from './context/CartContext'
import Navbar from './components/global/navbar'
import CartSidebar from './components/cart/CartSidebar'
import { Toaster } from 'react-hot-toast'

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
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body>
        <CartProvider>
          <Navbar />
          {children}
          <CartSidebar />
          <Toaster position="top-right" />
        </CartProvider>
        <Script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" />
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" />
      </body>
    </html>
  );
}
