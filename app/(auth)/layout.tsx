export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-lg font-semibold tracking-tight">VibeSaaS</span>
        </div>
        <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
