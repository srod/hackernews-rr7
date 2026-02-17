import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { useCallback, useEffect, useReducer } from "react";
import { CommentsList } from "~/components/post/Comments";
import { PostItem } from "~/components/post/Post";
import { CommentListSkeleton, PostSkeleton } from "~/components/Skeleton";
import { useOnlineStatus } from "~/hooks/useOnlineStatus";
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

type CommentsState = {
    comments: Comment[];
    loading: boolean;
    loadingMore: boolean;
    loadedCount: number;
};

type CommentsAction =
    | { type: "RESET" }
    | { type: "NO_KIDS" }
    | { type: "COMMENTS_LOADED"; comments: Comment[]; loadedCount: number }
    | { type: "LOAD_MORE_START" }
    | { type: "LOAD_MORE_DONE"; comments: Comment[] }
    | { type: "LOAD_MORE_ERROR" };

function commentsReducer(
    state: CommentsState,
    action: CommentsAction,
): CommentsState {
    switch (action.type) {
        case "RESET":
            return {
                comments: [],
                loading: true,
                loadingMore: false,
                loadedCount: 0,
            };
        case "NO_KIDS":
            return { ...state, loading: false };
        case "COMMENTS_LOADED":
            return {
                ...state,
                comments: action.comments,
                loadedCount: action.loadedCount,
                loading: false,
            };
        case "LOAD_MORE_START":
            return { ...state, loadingMore: true };
        case "LOAD_MORE_DONE":
            return {
                ...state,
                comments: [...state.comments, ...action.comments],
                loadedCount: state.loadedCount + action.comments.length,
                loadingMore: false,
            };
        case "LOAD_MORE_ERROR":
            return { ...state, loadingMore: false };
    }
}

function PostComponent() {
    const { post } = Route.useLoaderData();
    const isOnline = useOnlineStatus();
    const [state, dispatch] = useReducer(commentsReducer, {
        comments: [],
        loading: true,
        loadingMore: false,
        loadedCount: 0,
    });
    const { comments, loading, loadingMore, loadedCount } = state;

    const allKids = post?.kids ?? [];
    const hasMore = loadedCount < allKids.length;

    useEffect(() => {
        if (!post) return;
        markPostVisited(post.id, post.descendants ?? 0);
    }, [post]);

    useEffect(() => {
        if (!post?.kids) {
            dispatch({ type: "NO_KIDS" });
            return;
        }

        dispatch({ type: "RESET" });

        fetchComments(post.kids, 0, MAX_TOP_LEVEL)
            .then((fetched) =>
                dispatch({
                    type: "COMMENTS_LOADED",
                    comments: fetched,
                    loadedCount: Math.min(
                        MAX_TOP_LEVEL,
                        post.kids?.length ?? 0,
                    ),
                })
            )
            .catch(() => dispatch({ type: "NO_KIDS" }));
    }, [post?.kids]);

    const loadMore = useCallback(() => {
        if (!isOnline || loadingMore || !hasMore) return;

        dispatch({ type: "LOAD_MORE_START" });
        const nextBatch = allKids.slice(
            loadedCount,
            loadedCount + MAX_TOP_LEVEL,
        );

        fetchComments(nextBatch, 0)
            .then((fetched) =>
                dispatch({ type: "LOAD_MORE_DONE", comments: fetched })
            )
            .catch(() => dispatch({ type: "LOAD_MORE_ERROR" }));
    }, [isOnline, allKids, loadedCount, loadingMore, hasMore]);

    if (!post) return <div>Post not found</div>;

    return (
        <>
            <PostItem post={post} showText />
            {loading ? (
                <CommentListSkeleton />
            ) : (
                <CommentsList
                    comments={comments}
                    hasMore={hasMore && isOnline}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    op={post.by}
                />
            )}
        </>
    );
}
