import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { useEffect, useState } from "react";
import { CommentsList } from "~/components/post/Comments";
import { PostItem } from "~/components/post/Post";
import { CommentListSkeleton, PostSkeleton } from "~/components/Skeleton";
import { fetchComments, MAX_TOP_LEVEL } from "~/lib/fetch-comments";
import { fetchData } from "~/lib/fetch-data";
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
    const { id, post } = Route.useLoaderData();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!post?.kids) {
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchComments(post.kids, 0, MAX_TOP_LEVEL)
            .then(setComments)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [post?.kids]);

    if (!post) return <div>Post not found</div>;

    return (
        <>
            <PostItem post={post} showText />
            {loading ? (
                <CommentListSkeleton />
            ) : (
                <CommentsList
                    comments={comments}
                    hasMore={(post.kids?.length ?? 0) > comments.length}
                    postId={id}
                />
            )}
        </>
    );
}
