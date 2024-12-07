// import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
// import type { ClientLoaderFunctionArgs } from "@remix-run/react";
import { LRUCache } from "lru-cache";
// import { cacheClientLoader, useCachedLoaderData } from "remix-client-cache";
import { fetchData } from "~/lib/fetch-data";
import { UserItem } from "~/routes/user/components/User";
// import { UserItem } from "~/routes/user/components/User";
import type { User } from "~/types/User";
import type { Route } from "./+types/user";

// Create LRU Cache with options
const userCache = new LRUCache<string, User>({
	// Maximum number of items to store in the cache
	max: 1000,

	// How long to live in milliseconds (e.g., 5 minutes)
	ttl: 1000 * 60 * 5,
});

// Helper function to generate cache key
const getCacheKey = (id: string) => `user-${id}`;

export async function loader({ params }: Route.LoaderArgs) {
	const id = params.id;

	if (!id) return null;

	// Generate cache key for this request
	const cacheKey = getCacheKey(id);

	// Try to get posts from cache first
	let user = userCache.get(cacheKey);

	// If not in cache, fetch from API and store in cache
	if (!user) {
		user = await fetchData<User>(`user/${id}`);
		userCache.set(cacheKey, user);
	}

	return { id, user };
}

// Caches the loader data on the client
// export const clientLoader = (args: ClientLoaderFunctionArgs) =>
// 	cacheClientLoader(args);
// clientLoader.hydrate = true;

// export const meta: MetaFunction<typeof loader> = ({ data }) => {
// 	return [{ title: `Hacker News: ${data.id}` }];
// };

export default function UserRoute({ loaderData }: Route.ComponentProps) {
	const user = loaderData?.user;

	if (!user) {
		return null;
	}

	return <UserItem user={user} />;
}
