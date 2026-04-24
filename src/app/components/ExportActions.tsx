interface ExportActionItem {
  format: string;
  label: string;
  action: () => void;
  className: string;
}

interface ExportActionsProps {
  actions: ExportActionItem[];
  loading: string | null;
}

export function ExportActions({ actions, loading }: ExportActionsProps) {
  return (
    <>
      {actions.map(({ format, label, action, className }) => (
        <button
          key={format}
          onClick={action}
          disabled={loading === format}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${className}`}
        >
          {loading === format ? "..." : `Export ${label}`}
        </button>
      ))}
    </>
  );
}
