import styles from "./UpdateToast.module.css";

type UpdateToastProps = {
    onUpdate: () => void;
};

export function UpdateToast({ onUpdate }: UpdateToastProps) {
    return (
        <div className={styles.toast}>
            <span>New version available</span>
            <button type="button" onClick={onUpdate}>
                Update
            </button>
        </div>
    );
}
