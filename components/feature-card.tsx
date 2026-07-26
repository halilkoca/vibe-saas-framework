type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-6 hover:shadow-sm transition">
      <div className="text-2xl mb-3" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}