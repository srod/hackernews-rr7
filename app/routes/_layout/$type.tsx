import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { capitalize } from "radash";
import { useCallback, useEffect, useReducer, useRef } from "react";
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

type TypeState = {
    storyIds: string[];
    posts: Post[];
    loading: boolean;
    loadingMore: boolean;
    page: number;
};

type TypeAction =
    | { type: "RESET"; storyIds: string[] }
    | { type: "POSTS_LOADED"; posts: Post[] }
    | { type: "REFRESH"; storyIds: string[]; posts: Post[] }
    | { type: "LOAD_MORE_START" }
    | { type: "LOAD_MORE_DONE"; posts: Post[] }
    | { type: "LOAD_MORE_ERROR" };

function typeReducer(state: TypeState, action: TypeAction): TypeState {
    switch (action.type) {
        case "RESET":
            return {
                ...state,
                storyIds: action.storyIds,
                posts: [],
                page: 1,
                loading: true,
            };
        case "POSTS_LOADED":
            return { ...state, posts: action.posts, loading: false };
        case "REFRESH":
            return {
                ...state,
                storyIds: action.storyIds,
                posts: action.posts,
            };
        case "LOAD_MORE_START":
            return { ...state, loadingMore: true };
        case "LOAD_MORE_DONE":
            return {
                ...state,
                posts: [...state.posts, ...action.posts],
                page: state.page + 1,
                loadingMore: false,
            };
        case "LOAD_MORE_ERROR":
            return { ...state, loadingMore: false };
    }
}

function TypeComponent() {
    const { type, storyIds: initialStoryIds } = Route.useLoaderData();
    const router = useRouter();
    const isOnline = useOnlineStatus();
    const [state, dispatch] = useReducer(typeReducer, {
        storyIds: initialStoryIds,
        posts: [],
        loading: true,
        loadingMore: false,
        page: 1,
    });
    const { storyIds, posts, loading, loadingMore, page } = state;
    const loaderRef = useRef<HTMLDivElement>(null);
    const lastRefreshRef = useRef(0);

    const hasMore = page * POST_PER_PAGE < storyIds.length;

    const refresh = useCallback(async () => {
        if (!isOnline) return;
        const now = Date.now();
        if (now - lastRefreshRef.current < 5000) return;
        lastRefreshRef.current = now;

        navigator.serviceWorker?.controller?.postMessage("clearApiCache");
        storyIdsCache.delete(type);

        const freshIds = await fetchData<string[]>(`${type}stories`);
        storyIdsCache.set(type, freshIds);

        const firstPageIds = freshIds.slice(0, page * POST_PER_PAGE);
        for (const id of firstPageIds) {
            postsCache.delete(id);
        }

        const freshPosts = await fetchPosts(firstPageIds);
        dispatch({ type: "REFRESH", storyIds: freshIds, posts: freshPosts });

        router.invalidate();
    }, [isOnline, type, page, router]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        dispatch({ type: "RESET", storyIds: initialStoryIds });

        const initialIds = initialStoryIds.slice(0, POST_PER_PAGE);
        fetchPosts(initialIds)
            .then((fetched) =>
                dispatch({ type: "POSTS_LOADED", posts: fetched })
            )
            .catch(() => dispatch({ type: "POSTS_LOADED", posts: [] }));
    }, [initialStoryIds]);

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

        dispatch({ type: "LOAD_MORE_START" });
        const start = page * POST_PER_PAGE;
        const end = start + POST_PER_PAGE;
        const nextIds = storyIds.slice(start, end);

        fetchPosts(nextIds)
            .then((newPosts) =>
                dispatch({ type: "LOAD_MORE_DONE", posts: newPosts })
            )
            .catch(() => dispatch({ type: "LOAD_MORE_ERROR" }));
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
