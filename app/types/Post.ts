import type { Comment } from "./Comment";

export type PostTypes = "top" | "new" | "show" | "ask" | "best" | "job";

export type Post = {
    id: number;
    time: number;
    title: string;
    type: PostTypes;
    by?: string;
    descendants?: number;
    score?: number;
    text?: string;
    url?: string;
    index?: number;
    kids?: string[];
    comments?: Comment[];
};
