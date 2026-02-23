import { supabase } from './supabase';
import type { Profile, Contact, Experience } from '../types/database.types';

// ─── Profile ────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('fetchProfile error:', error.message);
        return null;
    }
    return data as Profile;
}

export async function updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'user_id' | 'created_at'>>
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

    return { error: error?.message ?? null };
}

// ─── Contacts ───────────────────────────────────────────

export async function fetchContacts(userId: string): Promise<Contact | null> {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('fetchContacts error:', error.message);
        return null;
    }
    return data as Contact;
}

export async function updateContacts(
    userId: string,
    updates: Partial<Omit<Contact, 'user_id'>>
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('user_id', userId);

    return { error: error?.message ?? null };
}

// ─── Experiences ────────────────────────────────────────

export async function insertExperiences(
    userId: string,
    items: Omit<Experience, 'id' | 'user_id'>[]
): Promise<{ error: string | null }> {
    if (items.length === 0) return { error: null };

    const rows = items.map((item) => ({ ...item, user_id: userId }));
    const { error } = await supabase.from('experiences').insert(rows);

    return { error: error?.message ?? null };
}

// ─── Avatar Upload ──────────────────────────────────────

export async function uploadAvatar(
    userId: string,
    file: File
): Promise<{ url: string | null; error: string | null }> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
}
