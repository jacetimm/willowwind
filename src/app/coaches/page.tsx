'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const CATEGORIES = ['life', 'business', 'creative', 'spiritual', 'nature'];
const LANGUAGES = ['ASL', 'English', 'Spanish'];

interface Coach {
    id: string;
    bio: string;
    categories: string[];
    languages: string[];
    hourly_rate: number;
    credentials: string;
}

export default function CoachesDirectory() {
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');

    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const { data, error } = await supabase
                    .from('coaches')
                    .select('*')
                    .not('bio', 'is', null)
                    .neq('bio', '');

                if (error) throw error;

                setCoaches(data || []);
            } catch (err: any) {
                console.error('Error fetching coaches:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCoaches();
    }, []);

    const filteredCoaches = coaches.filter(coach => {
        const categoryMatch = !selectedCategory || (coach.categories && coach.categories.includes(selectedCategory));
        const languageMatch = !selectedLanguage || (coach.languages && coach.languages.includes(selectedLanguage));
        return categoryMatch && languageMatch;
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-lg font-semibold text-gray-700">Loading coaches...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Find Your Coach</h1>
                    <p className="mt-2 text-gray-600">Browse our directory of qualified coaches.</p>
                </div>

                {/* Filters */}
                <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                        ))}
                    </select>

                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                        <option value="">All Languages</option>
                        {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="text-red-500 text-center mb-8">{error}</div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCoaches.map((coach) => (
                        <Link key={coach.id} href={`/coaches/${coach.id}`} className="block group">
                            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow h-full flex flex-col">
                                <div className="px-4 py-5 sm:p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900 group-hover:text-indigo-600">
                                            Coach
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            ${coach.hourly_rate}/hr
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                        {coach.bio}
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {coach.categories?.map(cat => (
                                                <span key={cat} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {coach.languages?.map(lang => (
                                                <span key={lang} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredCoaches.length === 0 && !loading && (
                    <div className="text-center text-gray-500 mt-12">
                        No coaches found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
