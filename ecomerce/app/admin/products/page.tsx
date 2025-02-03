import Sidebar from '@/app/components/admin/Sidebar/sidebar';
import CategoryManagement from '../components/products/category/category';


export default function ProductsPage() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="admin-content">
          <CategoryManagement />
        </div>
      </main>
    </div>
  );
}