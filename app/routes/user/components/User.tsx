import { formatDistance } from "date-fns";
import type { User } from "~/types/User";
import styles from "./User.module.css";

export function UserItem({ user }: { user: User }) {
	return (
		<div className={styles.user}>
			<h2 className={styles.user__title}>{user.id}</h2>
			<p className={styles.user__info}>
				Joined{" "}
				{formatDistance(new Date(user.created * 1000), new Date(), {
					addSuffix: true,
				})}{" "}
				• {user.karma} Karma
			</p>
			<h3 className={styles.user__about}>About</h3>
			<div
				// biome-ignore lint/security/noDangerouslySetInnerHtml: this is a safe value
				dangerouslySetInnerHTML={{ __html: user.about }}
			/>
		</div>
	);
}
