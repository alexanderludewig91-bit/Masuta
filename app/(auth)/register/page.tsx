import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Masuta</h1>
          <p className="text-center text-gray-800 mb-6">Japanisch Lernen</p>
          
          <RegisterForm />
          
          <p className="mt-4 text-center text-sm text-gray-700">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

