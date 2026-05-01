import styles from './SidebarSummary.module.css';

export function SidebarSummary({ imageUrl }: { imageUrl: string }) {
    return (
        <div className={styles.panel}>
            <img
                src={imageUrl}
                alt="Превью"
                className={styles.image}
            />
            <div className={styles.label}>Превью сцены</div>
        </div>
    );
}