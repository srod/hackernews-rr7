import type { Comment } from "~/types/Comment";
import { fetchData } from "./fetch-data";

const MAX_DEPTH = 2;
const MAX_TOP_LEVEL = 15;

export function fetchComments(
    ids: string[],
    depth = 0,
    limit?: number
): Promise<Comment[]> {
    const idsToFetch = limit ? ids.slice(0, limit) : ids;

    return Promise.all(
        idsToFetch.map(async (id) => {
            const comment = await fetchData<Comment>(`item/${id}`);

            if (comment.kids && depth < MAX_DEPTH) {
                comment.comments = await fetchComments(comment.kids, depth + 1);
            }
            return comment;
        })
    );
}

export { MAX_TOP_LEVEL };
