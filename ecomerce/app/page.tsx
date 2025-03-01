import Navbar from "./components/global/navbar";
import ProductGrid from "./components/home/product/Product";
import './globals.css'

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="wrapper">
        <section className="wrapper-assist">
          <ProductGrid />
        </section>
      </main>
    </div>
  );
}
