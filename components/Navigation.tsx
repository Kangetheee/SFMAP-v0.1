"use client"

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMedia } from "react-use";
import { NavButton } from "@/components/NavButton";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, PlusCircle, FileText, ShieldCheck, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Main navigation routes
const mainRoutes = [
  {
    href: "/",
    label: "Dashboard",
  },
  {
    href: "/transactions",
    label: "Transactions",
  },
  {
    href: "/accounts",
    label: "User Accounts",
  },
  {
    href: "/categories",
    label: "Category",
  },
  {
    href: "/literacy",
    label: "Financial Literacy",
  },
];

// Loan sub-routes
const loanRoutes = [
  {
    href: "/loans",
    label: "All Loans",
  },
  {
    href: "/loans/request-loan",
    label: "Request Loan",
    icon: <PlusCircle className="h-4 w-4 mr-2" />,
    requiresAuth: true,
  },
  {
    href: "/loans/my-loans",
    label: "My Loans",
    icon: <FileText className="h-4 w-4 mr-2" />,
    requiresAuth: true,
  },
  {
    href: "/loans/admin",
    label: "Admin",
    icon: <ShieldCheck className="h-4 w-4 mr-2" />,
    requiresAuth: true,
    requiresOwner: true,
  },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMedia("(max-width: 1024px)", false);

  const isLoanRoute = pathname.startsWith("/loans");

  const onClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  // Mobile navigation with all routes expanded
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger>
          <Button
            variant="outline"
            size="sm"
            className="font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus-visible:ring-offset-0 focus-visible:ring-transparent outline-none text-white focus:bg-white/30 transition"
          >
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="px-2">
          <nav className="flex flex-col gap-y-2 pt-6">
            {mainRoutes.map((route) => (
              <Button
                key={route.href}
                variant={route.href === pathname ? "secondary" : "ghost"}
                onClick={() => onClick(route.href)}
                className="w-full justify-start"
              >
                {route.label}
              </Button>
            ))}
            
            <div className="py-2">
              <div className="text-sm font-medium px-3 py-1 text-muted-foreground">
                Loan Management
              </div>
              {loanRoutes.map((route) => (
                <Button
                  key={route.href}
                  variant={route.href === pathname ? "secondary" : "ghost"}
                  onClick={() => onClick(route.href)}
                  className="w-full justify-start mt-1"
                >
                  {route.icon && route.icon}
                  {route.label}
                </Button>
              ))}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop navigation with dropdown for loans
  return (
    <nav className="hidden lg:flex items-center gap-x-2 overflow-x-auto">
      {mainRoutes.map((route) => (
        <NavButton
          key={route.href}
          href={route.href}
          label={route.label}
          isActive={pathname === route.href}
        />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isLoanRoute ? "secondary" : "ghost"}
            className="flex items-center gap-x-1 px-3 py-2 text-sm font-medium transition-colors"
          >
            Loan Applications
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {loanRoutes.map((route) => (
            <DropdownMenuItem
              key={route.href}
              onClick={() => onClick(route.href)}
              className="cursor-pointer"
            >
              {route.icon && route.icon}
              {route.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};