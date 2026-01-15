const MAX_CONCURRENT = 6; // Chrome has ~6 connections per domain
let activeRequests = 0;
const queue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
    if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        return Promise.resolve();
    }
    return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot(): void {
    const next = queue.shift();
    if (next) {
        next();
    } else {
        activeRequests--;
    }
}

export async function fetchData<T>(type: string): Promise<T> {
    await acquireSlot();
    try {
        const res = await fetch(
            `https://hacker-news.firebaseio.com/v0/${type}.json`
        );
        if (res.status !== 200) {
            throw new Error(`Status ${res.status}`);
        }
        return res.json() as T;
    } finally {
        releaseSlot();
    }
}
