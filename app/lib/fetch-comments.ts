import type { Comment } from "~/types/Comment";
import { fetchData } from "./fetch-data";

export function fetchComments(ids: string[]): Promise<Comment[]> {
    return Promise.all(
        ids.map(async (id) => {
            const comment = await fetchData<Comment>(`item/${id}`);

            if (comment.kids) {
                comment.comments = await fetchComments(comment.kids);
            }
            return comment;
        })
    );
}
