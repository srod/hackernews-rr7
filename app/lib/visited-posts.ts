const STORAGE_KEY = "hn-visited-posts";
const MAX_ENTRIES = 500;

type VisitedPost = {
    commentCount: number;
    visitedAt: number;
};

type VisitedPosts = Record<string, VisitedPost>;

function getVisitedPosts(): VisitedPosts {
    if (typeof window === "undefined") return {};
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

function saveVisitedPosts(posts: VisitedPosts): void {
    if (typeof window === "undefined") return;
    try {
        // Prune old entries if too many
        const entries = Object.entries(posts);
        if (entries.length > MAX_ENTRIES) {
            entries.sort((a, b) => b[1].visitedAt - a[1].visitedAt);
            posts = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {
        // localStorage might be full or disabled
    }
}

export function markPostVisited(
    postId: string | number,
    commentCount: number
): void {
    const posts = getVisitedPosts();
    posts[String(postId)] = {
        commentCount,
        visitedAt: Date.now(),
    };
    saveVisitedPosts(posts);
}

export function getNewCommentCount(
    postId: string | number,
    currentCount: number
): number {
    const posts = getVisitedPosts();
    const visited = posts[String(postId)];
    if (!visited) return 0;
    return Math.max(0, currentCount - visited.commentCount);
}

export function hasVisited(postId: string | number): boolean {
    const posts = getVisitedPosts();
    return String(postId) in posts;
}
