import styles from "./Input.module.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
};

export function Input({ className, ...props }: InputProps) {
    return (
        <input
            className={`${styles.input}${className ? ` ${className}` : ""}`}
            {...props}
        />
    );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    className?: string;
    children: React.ReactNode;
};

export function Select({ className, children, ...props }: SelectProps) {
    return (
        <select
            className={`${styles.input}${className ? ` ${className}` : ""}`}
            {...props}
        >
            {children}
        </select>
    );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
};

export function Textarea({ className, ...props }: TextareaProps) {
    return (
        <textarea
            className={`${styles.input} ${styles.textarea}${className ? ` ${className}` : ""}`}
            {...props}
        />
    );
}
