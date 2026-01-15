import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { useCallback, useEffect, useState } from "react";
import { CommentsList } from "~/components/post/Comments";
import { PostItem } from "~/components/post/Post";
import { CommentListSkeleton, PostSkeleton } from "~/components/Skeleton";
import { fetchComments, MAX_TOP_LEVEL } from "~/lib/fetch-comments";
import { fetchData } from "~/lib/fetch-data";
import { markPostVisited } from "~/lib/visited-posts";
import type { Comment } from "~/types/Comment";
import type { Post } from "~/types/Post";

const postCache = new LRUCache<string, Post>({
    max: 1000,
    ttl: 1000 * 60,
});

export const Route = createFileRoute("/_layout/post/$id")({
    loader: async ({ params }) => {
        const id = params.id;

        const postCacheKey = `post-${id}`;
        let post = postCache.get(postCacheKey);

        if (!post) {
            post = await fetchData<Post>(`item/${id}`);
            postCache.set(postCacheKey, post);
        }

        return { id, post };
    },
    staleTime: 30_000,
    head: ({ loaderData }) => ({
        meta: [{ title: `Hacker News: ${loaderData?.post?.title}` }],
    }),
    component: PostComponent,
    pendingComponent: () => (
        <>
            <PostSkeleton />
            <CommentListSkeleton />
        </>
    ),
});

function PostComponent() {
    const { post } = Route.useLoaderData();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadedCount, setLoadedCount] = useState(0);

    const allKids = post?.kids ?? [];
    const hasMore = loadedCount < allKids.length;

    // Mark post as visited to track new comments
    useEffect(() => {
        if (post) {
            markPostVisited(post.id, post.descendants ?? 0);
        }
    }, [post]);

    useEffect(() => {
        if (!post?.kids) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setComments([]);
        setLoadedCount(0);

        fetchComments(post.kids, 0, MAX_TOP_LEVEL)
            .then((fetched) => {
                setComments(fetched);
                setLoadedCount(Math.min(MAX_TOP_LEVEL, post.kids?.length ?? 0));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [post?.kids]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const nextBatch = allKids.slice(
            loadedCount,
            loadedCount + MAX_TOP_LEVEL
        );

        fetchComments(nextBatch, 0)
            .then((fetched) => {
                setComments((prev) => [...prev, ...fetched]);
                setLoadedCount((prev) => prev + fetched.length);
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false));
    }, [allKids, loadedCount, loadingMore, hasMore]);

    if (!post) return <div>Post not found</div>;

    return (
        <>
            <PostItem post={post} showText />
            {loading ? (
                <CommentListSkeleton />
            ) : (
                <CommentsList
                    comments={comments}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                />
            )}
        </>
    );
}
