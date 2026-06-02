interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="rounded-xl bg-card border border-border p-6 md:p-8">
    <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
      {title}
    </h2>
    <div className="text-muted-foreground leading-relaxed text-sm">{children}</div>
  </div>
);

export default Section;

