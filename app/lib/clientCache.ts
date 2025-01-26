import type { QueryKey } from "@tanstack/react-query";
import { queryClient } from "~/root";

export async function clientCache<T>(
    queryKey: QueryKey,
    serverLoader: () => Promise<T>
) {
    // Try to get the data from the cache
    const cachedData = queryClient.getQueryData<T>(queryKey);
    console.log("cachedData", cachedData);

    // Either use the cached data or fetch it from the server
    const data = cachedData ?? (await serverLoader());
    console.log("data", data);

    // Don't set the data if it's already there
    if (!cachedData) {
        console.log("will set data in cache", data);
        queryClient.setQueryData(queryKey, data);
    }

    return data;
}
