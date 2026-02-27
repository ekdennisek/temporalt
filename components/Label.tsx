import styles from "./Label.module.css";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
    className?: string;
    children: React.ReactNode;
};

export function Label({ className, children, ...props }: LabelProps) {
    return (
        <label
            className={`${styles.label}${className ? ` ${className}` : ""}`}
            {...props}
        >
            {children}
        </label>
    );
}
