'use client'

import { OutlineClose, OutlineMenu, OutlineImage, OutlineBell } from "@/icons/Icons";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./theme-toggle";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription
} from "./ui/sheet";
import { Button } from "./ui/button";

const navigationLinks = [
  { href: "/", label: "Home", icon: null },
  { href: "/explore", label: "Explore", icon: null },
  { href: "/following", label: "Following", icon: null },
];

export default function Header() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const NavLinks = ({ onClick, className }: { onClick?: () => void, className?: string }) => (
    <>
      {navigationLinks.map((link) => {
        const isActive = link.href === "/"
          ? pathname === "/" || pathname === ""
          : pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-neutral-950 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:text-neutral-100",
              className
            )}
          >
            {link.icon && <span className="text-base">{link.icon}</span>}
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky mx-auto max-w-4xl top-0 z-50">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        {/* <Link href="/" className="flex items-center gap-2">
          <SolidLogo size={32} />
        </Link> */}

        {/* Search Bar - Hidden on mobile */}
        {/* {!isMobile && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, artworks..."
                className="max-w-[300px]"
              />
            </div>
          </div>
        )} */}

        {/* Navigation - Desktop */}
        {!isMobile && (
          <nav className="flex rounded-xl p-1 mx-auto items-center gap-1 bg-white/90 dark:bg-black/80 backdrop-blur-2xl">
            <NavLinks />
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex rounded-full p-1 bg-white/90 dark:bg-black/80 backdrop-blur-2xl items-center gap-3 absolute right-0">
          {/* Upload button - Desktop only */}
          {/* {!isMobile && (
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              <OutlineImage size={16} />
              Upload
            </Link>
          )} */}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <OutlineBell size={20} />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Profile menu */}
          <Button variant="ghost" size="icon" className="relative rounded-full group/avatar">
            <div className="size-8 rounded-full overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face"
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover group-hover/avatar:scale-110 transition-all duration-300"
              />
            </div>
          </Button>

          {/* Mobile menu */}
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <OutlineMenu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-0">
                <div className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation and search</SheetDescription>
                </div>

                {/* Mobile header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-semibold text-lg">Menu</span>
                  <SheetClose asChild>
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <OutlineClose size={20} />
                    </button>
                  </SheetClose>
                </div>

                {/* Mobile search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search artists, artworks..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    />
                  </div>
                </div>

                {/* Mobile navigation */}
                <nav className="flex flex-col gap-2 p-4">
                  <NavLinks onClick={() => setIsOpen(false)} />

                  {/* Mobile upload button */}
                  <Link
                    href="/upload"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium mt-4"
                  >
                    <OutlineImage size={16} />
                    Upload Artwork
                  </Link>
                </nav>

                {/* Mobile theme toggle */}
                <div className="p-4 border-t mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dark mode</span>
                    <ModeToggle />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop theme toggle */}
          {/* {!isMobile && <ModeToggle />} */}
        </div>
      </div>
    </header>
  );
}
