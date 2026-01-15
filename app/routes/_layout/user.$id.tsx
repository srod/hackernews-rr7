import { createFileRoute } from "@tanstack/react-router";
import { LRUCache } from "lru-cache";
import { UserItem } from "~/components/user/User";
import { fetchData } from "~/lib/fetch-data";
import type { User } from "~/types/User";

const userCache = new LRUCache<string, User>({
    max: 1000,
    ttl: 1000 * 60 * 5,
});

const getCacheKey = (id: string) => `user-${id}`;

export const Route = createFileRoute("/_layout/user/$id")({
    loader: async ({ params }) => {
        const id = params.id;

        const cacheKey = getCacheKey(id);
        let user = userCache.get(cacheKey);

        if (!user) {
            user = await fetchData<User>(`user/${id}`);
            userCache.set(cacheKey, user);
        }

        return { id, user };
    },
    staleTime: 30_000,
    head: ({ loaderData }) => ({
        meta: [
            { title: `Hacker News: ${loaderData?.user?.id ?? loaderData?.id}` },
        ],
    }),
    component: UserComponent,
});

function UserComponent() {
    const { user } = Route.useLoaderData();

    if (!user) {
        return <div>User not found</div>;
    }

    return <UserItem user={user} />;
}
