import { LRUCache } from "lru-cache";
import { capitalize } from "radash";
import { useCallback } from "react";
import { useRevalidator } from "react-router";
import { items } from "~/components/Header";
import { More } from "~/components/More";
import { useVisibilityChange } from "~/hooks/useVisibilityChange";
import { fetchData } from "~/lib/fetch-data";
import { PostItem } from "~/routes/post/components/Post";
import type { Post, PostTypes } from "~/types/Post";
import type { Route } from "./+types/type";

const POST_PER_PAGE = 30;

async function postsFetcher(type: PostTypes, page: number) {
    const storyIds = await fetchData<string[]>(`${type}stories`);
    const [start, end] = [POST_PER_PAGE * (page - 1), POST_PER_PAGE * page];

    return await Promise.all(
        storyIds.slice(start, end).map(async (id: string) => {
            return fetchData<Post>(`item/${id}`);
        })
    );
}

// Create LRU Cache with options
const postsCache = new LRUCache<string, Post[]>({
    // Maximum number of items to store in the cache
    max: 1000,

    // How long to live in milliseconds (e.g., 1 minute)
    ttl: 1000 * 60 * 1,
});

// Helper function to generate cache key
const getCacheKey = (type: PostTypes, page: number) => `${type}-${page}`;

export async function loader({ params, request }: Route.LoaderArgs) {
    if (params.type && !items.includes(params.type)) {
        return { type: "top", page: 1, posts: [], hasMore: false, nextPage: 2 };
    }

    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1");
    const type = params.type || "top";

    // Generate cache key for this request
    const cacheKey = getCacheKey(type as PostTypes, page);

    // Try to get posts from cache first
    let posts = postsCache.get(cacheKey);

    // If not in cache, fetch from API and store in cache
    if (!posts) {
        posts = await postsFetcher(type as PostTypes, page);
        postsCache.set(cacheKey, posts);
    }

    return {
        type,
        page,
        posts,
        hasMore: posts.length > 0,
        nextPage: page + 1,
    };
}

export function meta({ data }: Route.MetaArgs) {
    return [{ title: `Hacker News: ${capitalize(data.type)}` }];
}

export default function TypeRoute({ loaderData }: Route.ComponentProps) {
    const { type, posts, hasMore, nextPage } = loaderData;
    const { revalidate } = useRevalidator();

    const handleVisibilityChange = useCallback(() => {
        revalidate();
    }, [revalidate]);

    useVisibilityChange(handleVisibilityChange);

    if (!posts) return <div>Loading...</div>;

    return (
        posts && (
            <>
                {posts?.map((post) => (
                    <PostItem key={post.id} post={post} />
                ))}

                {hasMore && <More url={`/${type}?page=${nextPage}`} />}
            </>
        )
    );
}
