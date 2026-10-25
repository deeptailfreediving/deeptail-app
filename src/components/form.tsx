// 입력 폼 공통 요소
export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  hint,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        className="h-12 rounded-xl border border-line bg-white px-4 text-base text-ink placeholder:text-ink-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      {hint && <span className="text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

export function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-12 rounded-xl bg-brand text-base font-bold text-white transition hover:bg-brand-mid disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}
