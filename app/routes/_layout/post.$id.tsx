import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { Suspense, use } from "react";
import { Loading } from "~/components/Loading";
import { CommentsList } from "~/components/post/Comments";
import { PostItem } from "~/components/post/Post";
import { fetchComments } from "~/lib/fetch-comments";
import { fetchData } from "~/lib/fetch-data";
import type { Comment } from "~/types/Comment";
import type { Post } from "~/types/Post";

const postCache = new LRUCache<string, Post>({
    max: 1000,
    ttl: 1000 * 60,
});

const getCacheKey = (id: string) => `post-${id}`;

export const Route = createFileRoute("/_layout/post/$id")({
    loader: async ({ params }) => {
        const id = params.id;

        const cacheKey = getCacheKey(id);
        let post = postCache.get(cacheKey);

        if (!post) {
            post = await fetchData<Post>(`item/${id}`);
            postCache.set(cacheKey, post);
        }

        // Start fetching comments but don't await - stream them later
        const commentsPromise = post?.kids
            ? fetchComments(post.kids)
            : Promise.resolve([]);

        return { id, post, commentsPromise };
    },
    staleTime: 30_000,
    head: ({ loaderData }) => ({
        meta: [{ title: `Hacker News: ${loaderData?.post?.title}` }],
    }),
    component: PostComponent,
});

function PostComponent() {
    const { post, commentsPromise } = Route.useLoaderData();

    if (!post) return <div>Post not found</div>;

    return (
        <>
            <PostItem post={post} showText />
            <Suspense fallback={<Loading />}>
                <Comments commentsPromise={commentsPromise} />
            </Suspense>
        </>
    );
}

function Comments({
    commentsPromise,
}: {
    commentsPromise: Promise<Comment[]>;
}) {
    const comments = use(commentsPromise);
    return <CommentsList comments={comments} />;
}
