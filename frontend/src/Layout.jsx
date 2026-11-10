import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();
  const isStaff = user && (user.role === "STAFF" || user.role === "ADMIN");
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-y-2 px-6 pt-8">
        <Link to="/" className="font-display text-3xl tracking-tight">
          Bowl Builder
        </Link>
        <nav className="flex flex-wrap items-baseline gap-5 text-sm">
          {user ? (
            <>
              <Link to="/favorites" className="text-ink/70 hover:text-ink">
                Favorites
              </Link>
              <Link to="/orders" className="text-ink/70 hover:text-ink">
                My orders
              </Link>
              {isStaff && (
                <Link to="/kitchen" className="text-ink/70 hover:text-ink">
                  Kitchen
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link to="/admin" className="text-ink/70 hover:text-ink">
                  Admin
                </Link>
              )}
              <Link to="/profile" className="text-ink/70 hover:text-ink">
                Profile ({user.name})
              </Link>
              <button type="button" onClick={logout} className="font-medium text-berry hover:underline">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-ink/70 hover:text-ink">
                Sign in
              </Link>
              <Link to="/register" className="rounded-full bg-ink px-4 py-1.5 font-medium text-white">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}