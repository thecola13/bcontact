import { supabase } from './supabase';
import type { Profile, Contact, Experience } from '../types/database.types';

// ─── Profile ────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('fetchProfile error:', error.message);
        return null;
    }
    return data as Profile;
}

export async function updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

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
    updates: Partial<Omit<Contact, 'id' | 'user_id'>>
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
    items: Omit<Experience, 'id' | 'user_id' | 'created_at'>[]
): Promise<{ error: string | null }> {
    if (items.length === 0) return { error: null };

    const rows = items.map((item) => ({ ...item, user_id: userId }));
    const { error } = await supabase.from('experiences').insert(rows);

    return { error: error?.message ?? null };
}

export async function fetchExperiences(userId: string): Promise<Experience[]> {
    const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('fetchExperiences error:', error.message);
        return [];
    }
    return (data as Experience[]) ?? [];
}

export async function deleteExperiences(
    userId: string
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('user_id', userId);

    return { error: error?.message ?? null };
}


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

// ─── Search Queries ─────────────────────────────────────

/**
 * Text search across profiles (name, degree).
 * Only returns onboarded profiles, excludes the calling user.
 */
export async function searchProfiles(
    query: string,
    currentUserId: string,
    limit = 50,
    offset = 0
): Promise<Profile[]> {
    const pattern = `%${query}%`;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_completed', true)
        .neq('id', currentUserId)
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},current_degree.ilike.${pattern}`)
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('searchProfiles error:', error.message);
        return [];
    }
    return (data as Profile[]) ?? [];
}

/**
 * Fetch profiles by an array of IDs (for merging with experience search results).
 */
export async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_completed', true)
        .in('id', ids);

    if (error) {
        console.error('fetchProfilesByIds error:', error.message);
        return [];
    }
    return (data as Profile[]) ?? [];
}

/**
 * Search experiences filtered by type, returning matching user_ids.
 * Searches across organization, role, and code fields.
 */
export async function searchExperienceUsers(
    query: string,
    expType: string,
    currentUserId: string,
    limit = 200
): Promise<string[]> {
    const pattern = `%${query}%`;

    let q = supabase
        .from('experiences')
        .select('user_id')
        .eq('exp_type', expType)
        .neq('user_id', currentUserId)
        .limit(limit);

    if (query.trim()) {
        q = q.or(`organization.ilike.${pattern},role.ilike.${pattern},code.ilike.${pattern}`);
    }

    const { data, error } = await q;

    if (error) {
        console.error('searchExperienceUsers error:', error.message);
        return [];
    }

    // Deduplicate user_ids
    const ids = new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
    return [...ids];
}

/**
 * Fetch all experiences for a set of users (for result card badges).
 */
export async function fetchExperiencesForUsers(
    userIds: string[]
): Promise<Experience[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .in('user_id', userIds);

    if (error) {
        console.error('fetchExperiencesForUsers error:', error.message);
        return [];
    }
    return (data as Experience[]) ?? [];
}

/**
 * Browse all onboarded profiles (for initial empty-query state).
 */
export async function browseProfiles(
    currentUserId: string,
    limit = 50,
    offset = 0
): Promise<Profile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_completed', true)
        .neq('id', currentUserId)
        .order('first_name', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('browseProfiles error:', error.message);
        return [];
    }
    return (data as Profile[]) ?? [];
}
