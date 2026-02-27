import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    fullWidth?: boolean;
    className?: string;
};

export function Button({ variant = "primary", fullWidth, className, ...props }: ButtonProps) {
    const cls = `${styles.button} ${styles[variant]}${fullWidth ? ` ${styles.fullWidth}` : ""}${className ? ` ${className}` : ""}`;
    return <button className={cls} {...props} />;
}
