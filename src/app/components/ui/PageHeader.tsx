interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-5xl font-semibold text-foreground mb-2 tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      </div>
      {action && <div className="flex items-center gap-3 flex-wrap">{action}</div>}
    </div>
  );
}