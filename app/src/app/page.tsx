import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            HireBest
          </h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-stone-900 dark:text-stone-50 mb-6">
            AI-Powered Hiring Assessments
          </h2>
          <p className="text-xl text-stone-600 dark:text-stone-400 mb-8">
            Find the best candidates faster with conversational AI assessments.
            Objective data for better hiring decisions.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-teal-600 dark:text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
              Conversational Assessments
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              AI-driven chat interface that adapts to candidate responses for a
              natural assessment experience.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-orange-600 dark:text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
              Objective Scoring
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              AI analyzes responses and provides consistent, unbiased scoring
              with detailed feedback.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
            <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-stone-600 dark:text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
              Save Time
            </h3>
            <p className="text-stone-600 dark:text-stone-400">
              Reduce screening time by 80%. Focus on the best candidates with
              data-driven insights.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-stone-500 dark:text-stone-500">
          <p>&copy; 2026 HireBest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
