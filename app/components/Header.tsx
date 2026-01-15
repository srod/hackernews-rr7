import { Link } from "@tanstack/react-router";
import { capitalize } from "radash";
import type { PostTypes } from "~/types/Post";
import logo from "../assets/icon.png";
import styles from "./Header.module.css";

export const items: PostTypes[] = ["top", "ask", "show", "best", "new"];

export function Header() {
    return (
        <header className={styles.header}>
            <h1>
                <Link
                    to="/$type"
                    params={{ type: "top" }}
                    search={{ page: 1 }}
                    className={styles.header__title}
                >
                    <span>
                        <img src={logo} alt="Hacker News" width={19} />
                    </span>
                </Link>
            </h1>
            <nav className={styles.header__nav}>
                {items.map((item) => (
                    <Link
                        key={item}
                        to="/$type"
                        params={{ type: item }}
                        search={{ page: 1 }}
                        activeProps={{ className: styles.header__linkActive }}
                        inactiveProps={{ className: styles.header__link }}
                    >
                        {capitalize(item)}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
