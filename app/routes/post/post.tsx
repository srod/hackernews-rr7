import { LRUCache } from "lru-cache";
import { useCallback } from "react";
import { useRevalidator } from "react-router";
import { useVisibilityChange } from "~/hooks/useVisibilityChange";
import { fetchData } from "~/lib/fetch-data";
import { Comments } from "~/routes/post/components/Comments";
import { PostItem } from "~/routes/post/components/Post";
import type { Post } from "~/types/Post";
import type { Route } from "./+types/post";

// Create LRU Cache with options
const postCache = new LRUCache<string, Post>({
    // Maximum number of items to store in the cache
    max: 1000,

    // How long to live in milliseconds (e.g., 1 minute)
    ttl: 1000 * 60 * 1,
});

// Helper function to generate cache key
const getCacheKey = (id: string) => `post-${id}`;

export async function loader({ params }: Route.LoaderArgs) {
    const id = params.id;

    if (!id) return null;

    // Generate cache key for this request
    const cacheKey = getCacheKey(id);

    // Try to get posts from cache first
    let post = postCache.get(cacheKey);

    // If not in cache, fetch from API and store in cache
    if (!post) {
        post = await fetchData<Post>(`item/${id}`);
        postCache.set(cacheKey, post);
    }

    return {
        id,
        post,
    };
}

export function meta({ data }: Route.MetaArgs) {
    return [{ title: `Hacker News: ${data?.post.title}` }];
}

export default function PostRoute({ loaderData }: Route.ComponentProps) {
    const post = loaderData?.post;
    const { revalidate } = useRevalidator();

    const handleVisibilityChange = useCallback(() => {
        revalidate();
    }, [revalidate]);

    useVisibilityChange(handleVisibilityChange);

    if (!post) return <div>Loading...</div>;

    return (
        <>
            <PostItem post={post} showText={true} />
            <Comments id={loaderData?.id} kids={post.kids} />
        </>
    );
}
