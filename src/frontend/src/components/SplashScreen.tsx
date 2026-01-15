export default function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <div className="text-center space-y-6 animate-in fade-in duration-700">
        <div className="flex justify-center">
          <img 
            src="/assets/MEMPO Logo 01.png" 
            alt="MEMPO Logo" 
            className="h-32 w-32 sm:h-40 sm:w-40 object-contain rounded-3xl shadow-2xl animate-in zoom-in duration-500"
          />
        </div>
        <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MEMPO
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-medium">
            Manajemen Antrian Real-Time
          </p>
        </div>
      </div>
    </div>
  );
}
