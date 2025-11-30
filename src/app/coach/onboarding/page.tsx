'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['life', 'business', 'creative', 'spiritual', 'nature'];
const LANGUAGES = ['ASL', 'English', 'Spanish'];

export default function CoachOnboarding() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Form state
    const [bio, setBio] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [credentials, setCredentials] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Check role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile || profile.role !== 'coach') {
                    router.push('/dashboard');
                    return;
                }

                setUser(user);

                // Check if coach profile already exists to pre-fill
                const { data: coachData } = await supabase
                    .from('coaches')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (coachData) {
                    setBio(coachData.bio || '');
                    setSelectedCategories(coachData.categories || []);
                    setSelectedLanguages(coachData.languages || []);
                    setCredentials(coachData.credentials || '');
                    setHourlyRate(coachData.hourly_rate?.toString() || '');
                }

            } catch (err) {
                console.error('Error checking access:', err);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [router]);

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleLanguageChange = (language: string) => {
        setSelectedLanguages(prev =>
            prev.includes(language)
                ? prev.filter(l => l !== language)
                : [...prev, language]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('coaches')
                .upsert({
                    user_id: user.id,
                    bio,
                    categories: selectedCategories,
                    languages: selectedLanguages,
                    credentials,
                    hourly_rate: parseFloat(hourlyRate),
                }, { onConflict: 'user_id' });

            if (upsertError) throw upsertError;

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-lg font-semibold text-gray-700">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Coach Onboarding</h1>
                    <p className="mt-2 text-gray-600">Complete your profile to start accepting clients.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bio */}
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                            Bio
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="bio"
                                rows={4}
                                required
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">Categories</span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {CATEGORIES.map((category) => (
                                <label key={category} className="inline-flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedCategories.includes(category)}
                                        onChange={() => handleCategoryChange(category)}
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{category}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-2">Languages</span>
                        <div className="flex flex-wrap gap-4">
                            {LANGUAGES.map((language) => (
                                <label key={language} className="inline-flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedLanguages.includes(language)}
                                        onChange={() => handleLanguageChange(language)}
                                    />
                                    <span className="text-sm text-gray-700">{language}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Credentials */}
                    <div>
                        <label htmlFor="credentials" className="block text-sm font-medium text-gray-700">
                            Credentials
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                id="credentials"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={credentials}
                                onChange={(e) => setCredentials(e.target.value)}
                                placeholder="e.g. Certified Life Coach, PhD"
                            />
                        </div>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                            Hourly Rate ($)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                id="hourlyRate"
                                required
                                min="0"
                                step="0.01"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
