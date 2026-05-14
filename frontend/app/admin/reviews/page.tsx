'use client';

import Sidebar from '@/app/admin/components/Sidebar/sidebar';
import ReviewManagement from '@/app/admin/components/reviews/ReviewManagement';

export default function AdminReviewsPage() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden p-6 md:p-8">
                <div className="mb-6 border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-bold text-slate-800">Reviews</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Moderate pending reviews so shoppers only see approved content. Product ratings update when you
                        approve or reject.
                    </p>
                </div>
                <ReviewManagement />
            </main>
        </div>
    );
}
