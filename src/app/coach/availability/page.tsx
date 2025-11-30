'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilitySlot {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export default function CoachAvailability() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Form state
    const [dayOfWeek, setDayOfWeek] = useState<number>(1);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

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
                await fetchSlots(user.id);
            } catch (err) {
                console.error('Error checking access:', err);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [router]);

    const fetchSlots = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('availability')
                .select('*')
                .eq('coach_id', userId)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            setSlots(data || []);
        } catch (err: any) {
            console.error('Error fetching slots:', err);
            setError(err.message);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('availability')
                .insert({
                    coach_id: user.id,
                    day_of_week: dayOfWeek,
                    start_time: startTime,
                    end_time: endTime,
                });

            if (insertError) throw insertError;

            await fetchSlots(user.id);

            // Reset form
            setDayOfWeek(1);
            setStartTime('09:00');
            setEndTime('17:00');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('availability')
                .delete()
                .eq('id', slotId);

            if (deleteError) throw deleteError;

            await fetchSlots(user.id);
        } catch (err: any) {
            setError(err.message);
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
                    <p className="mt-2 text-gray-600">Set your available hours for client bookings.</p>
                </div>

                {error && (
                    <div className="mb-6 text-red-500 text-sm bg-red-50 p-3 rounded">
                        {error}
                    </div>
                )}

                {/* Add Slot Form */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Availability Slot</h2>
                    <form onSubmit={handleAddSlot} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                                    Day of Week
                                </label>
                                <select
                                    id="dayOfWeek"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                >
                                    {DAYS.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    id="startTime"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    id="endTime"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {submitting ? 'Adding...' : 'Add Slot'}
                        </button>
                    </form>
                </div>

                {/* Existing Slots */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Availability</h2>
                    {slots.length === 0 ? (
                        <p className="text-gray-500 text-sm">No availability slots set. Add your first slot above.</p>
                    ) : (
                        <div className="space-y-2">
                            {slots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div className="flex items-center space-x-4">
                                        <span className="font-medium text-gray-900 w-24">{DAYS[slot.day_of_week]}</span>
                                        <span className="text-gray-600">{slot.start_time} - {slot.end_time}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSlot(slot.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
