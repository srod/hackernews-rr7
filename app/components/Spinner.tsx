import { cx } from "class-variance-authority";
import { forwardRef } from "react";
import type { ComponentRef, HTMLAttributes } from "react";
import styles from "./Spinner.module.css";

type SpinnerElement = ComponentRef<"span">;
interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
    className?: string;
}

export const Spinner = forwardRef<SpinnerElement, SpinnerProps>(
    ({ className, ...props }, forwardedRef) => {
        return (
            <span
                {...props}
                ref={forwardedRef}
                className={cx(styles.spinner, className)}
            >
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
                <span className={styles.spinner__leaf} />
            </span>
        );
    }
);
Spinner.displayName = "Spinner";
