import { Link, NavLink } from "react-router";
import { capitalize } from "radash";
import logo from "../assets/icon.png";
import styles from "./Header.module.css";

export const items = ["top", "ask", "show", "best", "new"];

export function Header() {
    return (
        <header className={styles.header}>
            <h1>
                <Link
                    to={"/top"}
                    className={styles.header__title}
                    viewTransition
                >
                    <span>
                        <img src={logo} alt="Hacker News" width={19} />
                    </span>
                </Link>
            </h1>
            <nav className={styles.header__nav}>
                {items.map((item) => (
                    <NavLink
                        key={item}
                        to={`/${item}`}
                        className={({ isActive, isPending }) =>
                            isPending
                                ? ""
                                : isActive
                                  ? styles.header__linkActive
                                  : styles.header__link
                        }
                        viewTransition
                    >
                        {capitalize(item)}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}
