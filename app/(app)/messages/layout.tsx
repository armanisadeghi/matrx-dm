export default function MessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh bg-bg-primary">
      {children}
    </div>
  );
}
