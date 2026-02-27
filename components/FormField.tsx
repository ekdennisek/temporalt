import styles from "./FormField.module.css";
import labelStyles from "./Label.module.css";

type FormFieldProps = {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};

export function FormField({ label, htmlFor, children, className, style }: FormFieldProps) {
    return (
        <div className={`${styles.field}${className ? ` ${className}` : ""}`} style={style}>
            <label htmlFor={htmlFor} className={labelStyles.label}>
                {label}
            </label>
            {children}
        </div>
    );
}
