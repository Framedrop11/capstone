import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded-lg p-6 space-y-3">
        <div className="text-2xl font-semibold">Page not found</div>
        <div className="text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist.
        </div>
        <Link className="underline text-sm" href="/login">
          Go to login
        </Link>
      </div>
    </div>
  );
}
