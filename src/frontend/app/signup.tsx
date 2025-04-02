import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';


interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  confirmPassword:string;
}


const SignUp: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email:'',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    try {
      setLoading(true);
      
      // ersetzemer mit API enpoints
      const response = await fetch('/api/auth/signup', {
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrierung fehlgeschlagen');
      }

      // Redirect to login page or dashboard
      router.push('/signin');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Registrieren | Quillium</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">Quillium</h1>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-4">Konto erstellen</h2>
          <p className="text-gray-600 text-center mb-6">
            Erstelle deinen Account für Quillium
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dein Name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="deine@email.com"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Passwort
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mindestens 8 Zeichen"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Passwort wiederholen"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200"
            >
              {loading ? 'Wird verarbeitet...' : 'Registrieren'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Bereits ein Konto?{' '}
              <Link href="/signin" className="text-indigo-600 hover:text-indigo-800">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;