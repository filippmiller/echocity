export default function ForBusinessesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">For Businesses</h1>
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Grow Your Business</h2>
          <p className="text-gray-700 mb-4">
            Join CityEcho to reach more customers and increase your visibility in local search.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">Benefits:</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>List your business and locations</li>
            <li>Showcase your menu, prices, and special offers</li>
            <li>Get discovered by customers searching for your services</li>
            <li>Manage multiple locations from one dashboard</li>
          </ul>
          <div className="mt-8">
            <a
              href="/auth/register"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
            >
              Register Your Business
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

