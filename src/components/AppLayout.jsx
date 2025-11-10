export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      {/* Background animé avec vagues */}
      <div className="wave-background">
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Contenu au-dessus du fond */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
