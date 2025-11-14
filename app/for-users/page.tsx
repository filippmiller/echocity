export default function ForUsersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">For Users</h1>
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Find Local Places Easily</h2>
          <p className="text-gray-700 mb-4">
            CityEcho helps you discover cafes, salons, restaurants, and other services in your city.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">Features:</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Voice and text search for local places</li>
            <li>Find cafes, salons, restaurants, and more</li>
            <li>View menus, prices, and special offers</li>
            <li>Get directions and contact information</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

