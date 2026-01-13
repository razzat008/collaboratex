import { Code } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export function Navigation() {
  const { isSignedIn } = useUser();

  return (
    <nav className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">
            <Link to="/">CollaborateX</Link>
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm hover:text-accent transition">
            Features
          </a>
          <a href="#templates" className="text-sm hover:text-accent transition">
            Templates
          </a>
          <a href="#pricing" className="text-sm hover:text-accent transition">
            Pricing
          </a>
          <a href="#customers" className="text-sm hover:text-accent transition">
            Customers
          </a>
        </div>

        {/* Auth / Protected Links */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/playground"
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90 transition text-sm font-medium"
              >
                Playground
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm hover:text-accent transition cursor-pointer">
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition text-sm font-medium cursor-pointer">
                  Start free
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
