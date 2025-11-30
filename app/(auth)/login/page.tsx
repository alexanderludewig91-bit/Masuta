import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Masuta</h1>
          <p className="text-center text-gray-800 mb-6">Japanisch Lernen</p>
          
          <LoginForm />
          
          <p className="mt-4 text-center text-sm text-gray-700">
            Noch kein Konto?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

