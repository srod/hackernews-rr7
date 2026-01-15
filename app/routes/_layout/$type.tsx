import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { capitalize } from "radash";
import { useCallback, useEffect, useRef, useState } from "react";
import { items } from "~/components/Header";
import { PostItem } from "~/components/post/Post";
import { PostListSkeleton } from "~/components/Skeleton";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
import { fetchData } from "~/lib/fetch-data";
import type { Post, PostTypes } from "~/types/Post";

const POST_PER_PAGE = 30;

const storyIdsCache = new LRUCache<string, string[]>({
    max: 10,
    ttl: 1000 * 60,
});
const postsCache = new LRUCache<string, Post>({ max: 500, ttl: 1000 * 60 });

function isValidType(type: string): type is PostTypes {
    return (items as readonly string[]).includes(type);
}

export const Route = createFileRoute("/_layout/$type")({
    loader: async ({ params }) => {
        if (!isValidType(params.type)) {
            return { type: "top" as const, storyIds: [] };
        }
        const type = params.type;

        let storyIds = storyIdsCache.get(type);
        if (!storyIds) {
            storyIds = await fetchData<string[]>(`${type}stories`);
            storyIdsCache.set(type, storyIds);
        }

        return { type, storyIds };
    },
    staleTime: 30_000,
    head: ({ loaderData }) => ({
        meta: [
            { title: `Hacker News: ${capitalize(loaderData?.type ?? "top")}` },
        ],
    }),
    component: TypeComponent,
    pendingComponent: PostListSkeleton,
});

async function fetchPosts(ids: string[]): Promise<Post[]> {
    return Promise.all(
        ids.map(async (id) => {
            let post = postsCache.get(id);
            if (!post) {
                post = await fetchData<Post>(`item/${id}`);
                postsCache.set(id, post);
            }
            return post;
        })
    );
}

function TypeComponent() {
    const { type, storyIds: initialStoryIds } = Route.useLoaderData();
    const router = useRouter();
    const isOnline = useOnlineStatus();
    const [storyIds, setStoryIds] = useState(initialStoryIds);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const loaderRef = useRef<HTMLDivElement>(null);
    const lastRefreshRef = useRef(0);

    const hasMore = page * POST_PER_PAGE < storyIds.length;

    // Refresh function - fetches fresh story IDs and updates first page
    const refresh = useCallback(async () => {
        if (!isOnline) return;
        // Debounce - don't refresh more than once per 5 seconds
        const now = Date.now();
        if (now - lastRefreshRef.current < 5000) return;
        lastRefreshRef.current = now;
        // Clear cache to force fresh fetch
        storyIdsCache.delete(type);

        const freshIds = await fetchData<string[]>(`${type}stories`);
        storyIdsCache.set(type, freshIds);
        setStoryIds(freshIds);

        // Clear post cache for updated data
        const firstPageIds = freshIds.slice(0, page * POST_PER_PAGE);
        for (const id of firstPageIds) {
            postsCache.delete(id);
        }

        const freshPosts = await fetchPosts(firstPageIds);
        setPosts(freshPosts);

        // Also invalidate router cache
        router.invalidate();
    }, [isOnline, type, page, router]);

    // Initial load when type changes
    useEffect(() => {
        // Smooth scroll to top when switching tabs
        window.scrollTo({ top: 0, behavior: "smooth" });

        setStoryIds(initialStoryIds);
        setPosts([]);
        setPage(1);
        setLoading(true);

        const initialIds = initialStoryIds.slice(0, POST_PER_PAGE);
        fetchPosts(initialIds)
            .then(setPosts)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [initialStoryIds]);

    // Refetch on window focus
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refresh();
            }
        };

        const onFocus = () => {
            refresh();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange
            );
            window.removeEventListener("focus", onFocus);
        };
    }, [refresh]);

    const loadMore = useCallback(() => {
        if (!isOnline || loadingMore || !hasMore) return;

        setLoadingMore(true);
        const start = page * POST_PER_PAGE;
        const end = start + POST_PER_PAGE;
        const nextIds = storyIds.slice(start, end);

        fetchPosts(nextIds)
            .then((newPosts) => {
                setPosts((prev) => [...prev, ...newPosts]);
                setPage((prev) => prev + 1);
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false));
    }, [isOnline, storyIds, page, loadingMore, hasMore]);

    useIntersectionObserver(loaderRef, loadMore, {
        enabled: !loading && !loadingMore,
    });

    if (loading) return <PostListSkeleton />;

    return (
        <>
            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
            {hasMore && isOnline && (
                <div ref={loaderRef}>
                    {loadingMore && <PostListSkeleton count={3} />}
                </div>
            )}
        </>
    );
}
