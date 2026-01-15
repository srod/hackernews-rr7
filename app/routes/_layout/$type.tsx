import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { capitalize } from "radash";
import { useCallback, useEffect, useRef, useState } from "react";
import { items } from "~/components/Header";
import { PostItem } from "~/components/post/Post";
import { PostListSkeleton } from "~/components/Skeleton";
import { fetchData } from "~/lib/fetch-data";
import type { Post, PostTypes } from "~/types/Post";

const POST_PER_PAGE = 30;

const storyIdsCache = new LRUCache<string, string[]>({
    max: 10,
    ttl: 1000 * 60,
});
const postsCache = new LRUCache<string, Post>({ max: 500, ttl: 1000 * 60 });

function isValidType(type: string): type is PostTypes {
    return items.includes(type as PostTypes);
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
    const { storyIds } = Route.useLoaderData();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const loaderRef = useRef<HTMLDivElement>(null);

    const hasMore = page * POST_PER_PAGE < storyIds.length;

    // Reset when type changes
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setLoading(true);

        const initialIds = storyIds.slice(0, POST_PER_PAGE);
        fetchPosts(initialIds)
            .then(setPosts)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [storyIds]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;

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
    }, [storyIds, page, loadingMore, hasMore]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const loader = loaderRef.current;
        if (!loader) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && !loadingMore) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loader);
        return () => observer.disconnect();
    }, [loadMore, loading, loadingMore]);

    if (loading) return <PostListSkeleton />;

    return (
        <>
            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
            {hasMore && (
                <div ref={loaderRef}>
                    {loadingMore && <PostListSkeleton count={3} />}
                </div>
            )}
        </>
    );
}
