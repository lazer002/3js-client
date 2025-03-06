import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="relative">
      <Sidebar />
      <main className="min-h-screen bg-gray-100">
        {children}
      </main>
    </div>
  )
} 