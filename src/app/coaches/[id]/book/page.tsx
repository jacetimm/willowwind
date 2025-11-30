'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Coach {
    id: string;
    user_id: string;
    bio: string;
    hourly_rate: number;
}

export default function BookSession() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [coach, setCoach] = useState<Coach | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState(60);

    useEffect(() => {
        const initialize = async () => {
            try {
                // Check if user is logged in
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                setUser(user);

                // Fetch coach
                const { data: coachData, error: coachError } = await supabase
                    .from('coaches')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (coachError) throw coachError;

                setCoach(coachData);
            } catch (err: any) {
                console.error('Error initializing:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            initialize();
        }
    }, [params.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (!coach || !user) {
                throw new Error('Missing coach or user data');
            }

            // Combine date and time into a timestamptz
            const sessionDate = new Date(`${date}T${time}`);

            // Calculate price
            const price = coach.hourly_rate ? (coach.hourly_rate * (duration / 60)) : null;

            // Insert booking
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    client_id: user.id,
                    coach_id: coach.user_id, // Important: use coach's user_id (profiles.id), not coaches.id
                    session_date: sessionDate.toISOString(),
                    duration: duration,
                    status: 'pending',
                    price: price,
                    payment_id: null,
                });

            if (bookingError) throw bookingError;

            // Redirect to dashboard
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

    if (error && !coach) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="text-lg font-semibold text-gray-700">Coach not found</div>
                <Link href="/coaches" className="text-indigo-600 hover:text-indigo-500">
                    Back to Directory
                </Link>
            </div>
        );
    }

    if (!coach) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <Link href={`/coaches/${coach.id}`} className="text-indigo-600 hover:text-indigo-500 mb-6 inline-block">
                    ← Back to Coach Profile
                </Link>

                <div className="bg-white shadow rounded-lg p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
                        <p className="mt-2 text-gray-600">Schedule a session with this coach.</p>
                        <div className="mt-4 text-lg font-semibold text-green-700">
                            Rate: ${coach.hourly_rate}/hr
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 text-red-500 text-sm bg-red-50 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                                Session Date
                            </label>
                            <input
                                type="date"
                                id="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                                Session Time
                            </label>
                            <input
                                type="time"
                                id="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                Duration (minutes)
                            </label>
                            <select
                                id="duration"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={90}>90 minutes</option>
                                <option value={120}>120 minutes</option>
                            </select>
                        </div>

                        {coach.hourly_rate && (
                            <div className="bg-gray-50 p-4 rounded-md">
                                <div className="text-sm text-gray-700">
                                    Estimated Price: <span className="font-semibold text-gray-900">
                                        ${(coach.hourly_rate * (duration / 60)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <Link
                                href={`/coaches/${coach.id}`}
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
