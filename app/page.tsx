export default function HomePage() {
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">CSS Test</h1>
        <p className="text-green-600 mt-2">Si ves esto con fondo azul y caja blanca = CSS OK ✅</p>
        <p className="text-red-600 mt-2">Si no hay colores = CSS no llega ❌</p>
      </div>
    </div>
  );
}
