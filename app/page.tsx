import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">CityEcho</h1>
        <p className="text-center mb-8">
          Voice and text search for local places in your city
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}

