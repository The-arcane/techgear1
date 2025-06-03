export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TechGear. All rights reserved.
        </div>
        <div className="mt-4 flex justify-center space-x-6">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
