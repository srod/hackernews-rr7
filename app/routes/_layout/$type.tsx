import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { capitalize } from "radash";
import { items } from "~/components/Header";
import { More } from "~/components/More";
import { PostItem } from "~/components/post/Post";
import { PostListSkeleton } from "~/components/Skeleton";
import { fetchData } from "~/lib/fetch-data";
import type { Post, PostTypes } from "~/types/Post";

const POST_PER_PAGE = 30;

const postsCache = new LRUCache<string, Post[]>({ max: 1000, ttl: 1000 * 60 });

function isValidType(type: string): type is PostTypes {
    return items.includes(type as PostTypes);
}

export const Route = createFileRoute("/_layout/$type")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page) || 1,
    }),
    loaderDeps: ({ search }) => ({ page: search.page }),
    loader: async ({ params, deps }) => {
        if (!isValidType(params.type)) {
            return {
                type: "top" as const,
                posts: [],
                hasMore: false,
                nextPage: 2,
            };
        }
        const type = params.type;

        const cacheKey = `${type}-${deps.page}`;
        let posts = postsCache.get(cacheKey);

        if (!posts) {
            const storyIds = await fetchData<string[]>(`${type}stories`);
            const [start, end] = [
                POST_PER_PAGE * (deps.page - 1),
                POST_PER_PAGE * deps.page,
            ];
            posts = await Promise.all(
                storyIds
                    .slice(start, end)
                    .map((id) => fetchData<Post>(`item/${id}`))
            );
            postsCache.set(cacheKey, posts);
        }

        return {
            type,
            posts,
            hasMore: posts.length > 0,
            nextPage: deps.page + 1,
        };
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

function TypeComponent() {
    const { type, posts, hasMore, nextPage } = Route.useLoaderData();

    if (!posts) return <div>Loading...</div>;

    return (
        <>
            {posts.map((post) => (
                <PostItem key={post.id} post={post} />
            ))}
            {hasMore && <More type={type} nextPage={nextPage} />}
        </>
    );
}
