export type Comment = {
    by: string;
    id: number;
    parent: number;
    text: string;
    time: number;
    type: "comment";
    kids?: string[];
    comments?: Comment[];
};
