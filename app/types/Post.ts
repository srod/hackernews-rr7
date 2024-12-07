import type { Comment } from "./Comment";

export type PostTypes = "top" | "new" | "show" | "ask";

export type Post = {
	by: string;
	descendants: number;
	id: number;
	score: number;
	text: string;
	time: number;
	title: string;
	type: PostTypes;
	url: string;
	index: number;
	kids?: string[];
	comments?: Comment[];
};
