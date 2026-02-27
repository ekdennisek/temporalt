import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    className?: string;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
    const cls = `${styles.button} ${styles[variant]}${className ? ` ${className}` : ""}`;
    return <button className={cls} {...props} />;
}
