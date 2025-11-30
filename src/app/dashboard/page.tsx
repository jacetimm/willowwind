"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
    id: string;
    role: "client" | "coach" | null;
};

type Booking = {
    id: string;
    session_date: string;
    duration: number | null;
    status: string | null;
};

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            // get logged-in user
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                window.location.href = "/login";
                return;
            }

            setEmail(user.email ?? null);

            // get profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError || !profileData) {
                setError("Could not load profile.");
                setLoading(false);
                return;
            }

            const currentProfile: Profile = {
                id: profileData.id,
                role: profileData.role,
            };

            setProfile(currentProfile);

            // fetch upcoming bookings based on role
            let bookingsQuery = supabase
                .from("bookings")
                .select("id, session_date, duration, status");

            if (currentProfile.role === "client") {
                bookingsQuery = bookingsQuery
                    .eq("client_id", currentProfile.id)
                    .order("session_date", { ascending: true });
            } else if (currentProfile.role === "coach") {
                bookingsQuery = bookingsQuery
                    .eq("coach_id", currentProfile.id)
                    .order("session_date", { ascending: true });
            } else {
                setBookings([]);
                setLoading(false);
                return;
            }

            const { data: bookingsData, error: bookingsError } = await bookingsQuery;

            if (bookingsError) {
                setError("Could not load bookings.");
                setLoading(false);
                return;
            }

            setBookings((bookingsData ?? []) as Booking[]);
            setLoading(false);
        };

        load();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-700">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="w-full border-b bg-white">
                <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">WillowWind</h1>
                        <p className="text-sm text-gray-500">
                            Welcome{email ? `, ${email}` : ""}{" "}
                            {profile?.role ? `(${profile.role})` : ""}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Log out
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {error && (
                    <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <section className="bg-white rounded-lg shadow-sm border px-4 py-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Role overview
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        You are logged in as{" "}
                        <span className="font-medium">
                            {profile?.role ?? "no role set"}
                        </span>
                        .
                    </p>

                    {profile?.role === "coach" && (
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                            <a
                                href="/coach/onboarding"
                                className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
                            >
                                Edit coach profile
                            </a>
                            <a
                                href="/coach/availability"
                                className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-gray-50"
                            >
                                Manage availability
                            </a>
                        </div>
                    )}

                    {profile?.role === "client" && (
                        <p className="mt-3 text-sm text-gray-600">
                            Browse coaches at{" "}
                            <a href="/coaches" className="text-blue-600 hover:underline">
                                /coaches
                            </a>{" "}
                            to book a new session.
                        </p>
                    )}
                </section>

                <section className="bg-white rounded-lg shadow-sm border px-4 py-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Upcoming bookings
                    </h2>

                    {bookings.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-600">
                            No upcoming bookings yet.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {bookings.map((b) => (
                                <li
                                    key={b.id}
                                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {new Date(b.session_date).toLocaleString()}
                                        </p>
                                        <p className="text-gray-600">
                                            Duration: {b.duration ?? 0} min · Status:{" "}
                                            {b.status ?? "pending"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}