import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile, Experience } from '../types/database.types';
import {
    searchProfiles,
    searchExperienceUsers,
    fetchProfilesByIds,
    fetchExperiencesForUsers,
    browseProfiles,
} from '../lib/profile.service';

// ── Types ────────────────────────────────────────────
export type FilterType = 'all' | 'degree' | 'course' | 'exchange';

export interface SearchResult {
    profile: Profile;
    experiences: Experience[];
}

interface UseSearchReturn {
    query: string;
    setQuery: (q: string) => void;
    filter: FilterType;
    setFilter: (f: FilterType) => void;
    results: SearchResult[];
    loading: boolean;
    hasMore: boolean;
    loadMore: () => void;
}

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

// ── Hook ─────────────────────────────────────────────
export function useSearch(currentUserId: string | undefined): UseSearchReturn {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const abortRef = useRef(0); // simple generation counter to cancel stale requests

    // Core search function
    const executeSearch = useCallback(
        async (q: string, f: FilterType, pageOffset: number, append: boolean) => {
            if (!currentUserId) return;

            const generation = ++abortRef.current;
            if (!append) setLoading(true);

            try {
                let profiles: Profile[];

                if (f === 'all') {
                    // Text search across profiles
                    if (q.trim()) {
                        profiles = await searchProfiles(q, currentUserId, PAGE_SIZE, pageOffset);
                    } else {
                        profiles = await browseProfiles(currentUserId, PAGE_SIZE, pageOffset);
                    }
                } else {
                    // Filter-driven: search experiences by type, then fetch matching profiles
                    const userIds = await searchExperienceUsers(q, f, currentUserId);
                    // Paginate the user IDs
                    const pageIds = userIds.slice(pageOffset, pageOffset + PAGE_SIZE);
                    profiles = await fetchProfilesByIds(pageIds);
                    // hasMore is based on whether there are more IDs beyond this page
                    if (generation === abortRef.current) {
                        setHasMore(pageOffset + PAGE_SIZE < userIds.length);
                    }
                }

                // Abort if a newer search was triggered
                if (generation !== abortRef.current) return;

                // Fetch experiences for these profiles (for badges)
                const profileIds = profiles.map((p) => p.id);
                const experiences = await fetchExperiencesForUsers(profileIds);

                if (generation !== abortRef.current) return;

                // Group experiences by user
                const expMap = new Map<string, Experience[]>();
                for (const exp of experiences) {
                    const list = expMap.get(exp.user_id) ?? [];
                    list.push(exp);
                    expMap.set(exp.user_id, list);
                }

                const newResults: SearchResult[] = profiles.map((p) => ({
                    profile: p,
                    experiences: expMap.get(p.id) ?? [],
                }));

                if (append) {
                    setResults((prev) => {
                        // Deduplicate
                        const existingIds = new Set(prev.map((r) => r.profile.id));
                        const unique = newResults.filter((r) => !existingIds.has(r.profile.id));
                        return [...prev, ...unique];
                    });
                } else {
                    setResults(newResults);
                }

                // Set hasMore for profile-based queries (text / browse)
                if (f === 'all' && generation === abortRef.current) {
                    setHasMore(profiles.length >= PAGE_SIZE);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                if (generation === abortRef.current) {
                    setLoading(false);
                }
            }
        },
        [currentUserId]
    );

    // Debounced effect on query/filter change
    useEffect(() => {
        setOffset(0);
        setHasMore(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            executeSearch(query, filter, 0, false);
        }, query.trim() ? DEBOUNCE_MS : 0); // immediate for empty query (browse mode)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, filter, executeSearch]);

    // Load more
    const loadMore = useCallback(() => {
        if (loading || !hasMore) return;
        const newOffset = offset + PAGE_SIZE;
        setOffset(newOffset);
        executeSearch(query, filter, newOffset, true);
    }, [loading, hasMore, offset, query, filter, executeSearch]);

    return { query, setQuery, filter, setFilter, results, loading, hasMore, loadMore };
}
