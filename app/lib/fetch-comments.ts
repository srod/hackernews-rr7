import type { Comment } from "~/types/Comment";
import { fetchData } from "./fetch-data";

const MAX_DEPTH = 3;

export function fetchComments(ids: string[], depth = 0): Promise<Comment[]> {
    return Promise.all(
        ids.map(async (id) => {
            const comment = await fetchData<Comment>(`item/${id}`);

            if (comment.kids && depth < MAX_DEPTH) {
                comment.comments = await fetchComments(comment.kids, depth + 1);
            }
            return comment;
        })
    );
}
