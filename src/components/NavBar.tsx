import Link from "next/link";
import { useRouter } from "next/router";

const pages = [
  { name: "Dashboard", path: "/" },
  { name: "Staking", path: "/staking" },
  { name: "Vesting", path: "/vesting" },
  { name: "Token", path: "/token" },
  { name: "History", path: "/history" },
  { name: "Admin", path: "/admin" },
  { name: "Integration", path: "/integrationcheck" },
];

const NavBar = () => {
  const router = useRouter();

  return (
    <nav className="bg-black/90 p-4 flex justify-between items-center shadow-md">
      <div className="text-amber-400 font-bold text-xl">Lion-Eagle</div>
      <div className="hidden md:flex gap-4">
        {pages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className={`px-3 py-2 rounded font-semibold transition ${
              router.pathname === page.path
                ? "bg-amber-600 text-black"
                : "text-amber-300 hover:bg-amber-700 hover:text-black"
            }`}
          >
            {page.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
