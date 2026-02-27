import styles from "./SegmentedControl.module.css";

type SegmentedControlProps<T extends string> = {
    options: readonly T[];
    value: T;
    onChange: (value: T) => void;
    labels: Record<T, string>;
    className?: string;
};

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    labels,
    className,
}: SegmentedControlProps<T>) {
    return (
        <div className={`${styles.container}${className ? ` ${className}` : ""}`}>
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`${styles.option}${opt === value ? ` ${styles.active}` : ""}`}
                >
                    {labels[opt]}
                </button>
            ))}
        </div>
    );
}
