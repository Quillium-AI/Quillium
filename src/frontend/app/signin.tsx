import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const SignIn: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }

    try {
      setLoading(true);
      
      //dummy, das chömmer nachher ersetze
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Anmeldung fehlgeschlagen');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ungültige Anmeldedaten. Bitte überprüfe deine E-Mail und dein Passwort.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Anmelden | Quillium</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">Quillium</h1>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-4">Bei Quillium anmelden</h2>
          <p className="text-gray-600 text-center mb-6">
            Deine selbst-gehostete Open-Source KI
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  Passwort
                </label>
                <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                  Passwort vergessen?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dein Passwort"
                required
              />
            </div>
            
            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-gray-700">
                Angemeldet bleiben
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-200"
            >
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Noch kein Konto?{' '}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-800">
                Registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;

import type { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcrypt';
import { pool } from '../../../lib/db'; // For the DB coonectiion

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validierung
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Alle Felder müssen ausgefüllt werden.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Passwort muss mindestens 8 Zeichen lang sein.' });
    }

    // proofs if the mails exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Ein Benutzer mit dieser E-Mail existiert bereits.' });
    }

    // hash the passwd
    const hashedPassword = await hash(password, 10);

    // create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Benutzer erfolgreich erstellt',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { pool } from '../../../lib/db'; // For the DB coonectiion needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email, password, rememberMe } = req.body;

    // Proofs if mail is valid
    if (!email || !password) {
      return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
    }

    // search for user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const user = result.rows[0];

    // Passwd testing
    const passwordMatch = await compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // creating jwt
    const accessToken = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );


    let refreshToken = null;
    if (rememberMe) {
      refreshToken = sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Stores Refresh-Token in the db
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
        [user.id, refreshToken]
      );
    }

    res.status(200).json({
      message: 'Anmeldung erfolgreich',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
}