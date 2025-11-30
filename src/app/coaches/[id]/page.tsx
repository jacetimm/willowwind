'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Coach {
    id: string;
    bio: string;
    categories: string[];
    languages: string[];
    hourly_rate: number;
    credentials: string;
}

export default function CoachProfile() {
    const params = useParams();
    const [coach, setCoach] = useState<Coach | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCoach = async () => {
            try {
                const { data, error } = await supabase
                    .from('coaches')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (error) throw error;

                setCoach(data);
            } catch (err: any) {
                console.error('Error fetching coach:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchCoach();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-lg font-semibold text-gray-700">Loading profile...</div>
            </div>
        );
    }

    if (error || !coach) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="text-lg font-semibold text-gray-700">Coach not found</div>
                <Link href="/coaches" className="text-indigo-600 hover:text-indigo-500">
                    Back to Directory
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link href="/coaches" className="text-indigo-600 hover:text-indigo-500 mb-6 inline-block">
                    ← Back to Directory
                </Link>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold leading-6 text-gray-900">Coach Profile</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and expertise.</p>
                        </div>
                        <div className="text-xl font-bold text-green-700">
                            ${coach.hourly_rate}/hr
                        </div>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                                    {coach.bio}
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Categories</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <div className="flex flex-wrap gap-2">
                                        {coach.categories?.map(cat => (
                                            <span key={cat} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Languages</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    <div className="flex flex-wrap gap-2">
                                        {coach.languages?.map(lang => (
                                            <span key={lang} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Credentials</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {coach.credentials || 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-end">
                        <button
                            disabled
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Book a Session (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
