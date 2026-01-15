import { type RefObject, useEffect } from "react";

export function useIntersectionObserver(
    ref: RefObject<Element | null>,
    onIntersect: () => void,
    options?: { enabled?: boolean; rootMargin?: string }
) {
    const enabled = options?.enabled ?? true;
    const rootMargin = options?.rootMargin ?? "200px";

    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onIntersect();
                }
            },
            { rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, onIntersect, enabled, rootMargin]);
}
