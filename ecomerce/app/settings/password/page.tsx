import ChangePasswordForm from '@/app/components/auth/ChangePasswordForm';
import { Toaster } from 'react-hot-toast';

export default function ChangePasswordPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <ChangePasswordForm />
                <Toaster position="top-right" />
            </div>
        </div>
    );
}
