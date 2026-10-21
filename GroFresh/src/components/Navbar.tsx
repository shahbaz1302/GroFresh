"use client";

import { RootState } from "@/redux/store";
import {
  LogOut,
  Package,
  Search,
  ShoppingCart,
  User2,
  ChevronDown,
  X,
  PlusCircle,
  Boxes,
  ClipboardCheck,
  Menu,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { setCartData } from "@/redux/cartSlice";
import Cart from "./Cart";

interface SearchGroceryItem {
  _id: string;
  name: string;
  category: string;
  subCategory?: string;
  image: string;
  price: number;
  unit: string;
}

interface IUser {
  name: string;
  email: string;
  mobile?: string;
  role: "user" | "deliveryBoy" | "admin";
  image?: string;
}

const roleLabels: Record<IUser["role"], string> = {
  user: "Shopper",
  deliveryBoy: "Delivery partner",
  admin: "Administrator",
};

const searchSuggestions = [
  "Search milk",
  "Search chips",
  "Search fresh fruits",
  "Search bread",
  "Search eggs",
  "Search rice",
  "Search pulses",
  "Search oil",
  "Search pasta",
  "Search snacks",
  "Search beverages",
  "Search baby care",
  "Search personal care",
  "Search household supplies",
  "Search kitchenware",
];

const Navbar = ({ user }: { user: IUser }) => {
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const profileDropdown = useRef<HTMLDivElement>(null);
  const [openSideBar, setOpenSideBar] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartData } = useSelector((state: RootState) => state.cart);
  const cartQuantity = cartData.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const [searchResults, setSearchResults] = useState<SearchGroceryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  // Debounced search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/groceries/search?q=${encodeURIComponent(trimmed)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data.groceries || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const suggestionTimer = window.setInterval(() => {
      setSuggestionIndex((index) => (index + 1) % searchSuggestions.length);
    }, 2200);

    const handleClick = (event: MouseEvent) => {
      if (
        profileDropdown.current &&
        !profileDropdown.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setIsSearchDropdownOpen(false);
      }
    };

    const handleOpenCart = () => setIsCartOpen(true);

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("grofresh-open-cart", handleOpenCart);
    return () => {
      window.clearInterval(suggestionTimer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("grofresh-open-cart", handleOpenCart);
    };
  }, []);

  const handleSelectSearchItem = (item: SearchGroceryItem) => {
    setIsSearchDropdownOpen(false);
    setMobileSearchOpen(false);
    router.push(`/shop?category=${encodeURIComponent(item.category)}`);
  };

  const handleAddToCartFromSearch = (
    e: React.MouseEvent,
    item: SearchGroceryItem,
  ) => {
    e.stopPropagation();
    dispatch(
      setCartData({
        _id: item._id,
        name: item.name,
        category: item.category,
        image: item.image,
        price: item.price,
        unit: item.unit,
        quantity: 1,
      }),
    );
    toast.success(`Added ${item.name} to cart!`);
  };

  const SideBar = openSideBar
    ? createPortal(
        <AnimatePresence>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpenSideBar(false)}
            className="fixed inset-0 z-60 bg-[#183b2b]/30 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            key="sidebar-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-70 flex w-72 flex-col overflow-y-auto bg-white shadow-[8px_0_40px_-12px_rgba(24,59,43,0.35)] sm:w-80">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e8eee3] px-5 py-4">
              <h1 className="text-base font-bold tracking-tight text-[#183b2b]">
                Admin <span className="text-[#76a85b]">Panel</span>
              </h1>
              <button
                onClick={() => setOpenSideBar(false)}
                aria-label="Close sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#71836f] transition hover:bg-[#edf3e8] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* User card */}
            <div className="flex items-center gap-3 bg-[#f6f9f3] px-5 py-4">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e3efd8] text-[#547d46]">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <User2 aria-hidden="true" className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-[#284936]">
                  {user.name}
                </h2>
                <p className="mt-0.5 inline-flex rounded-full bg-[#eaf3e3] px-2 py-0.5 text-[10px] font-semibold text-[#547d46]">
                  {roleLabels[user.role]}
                </p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              <Link
                href="/add-grocery"
                onClick={() => setOpenSideBar(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#526557] transition hover:bg-[#f5f9f1] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-[#76a85b]">
                <PlusCircle
                  aria-hidden="true"
                  className="h-4.5 w-4.5 shrink-0 text-[#76a85b]"
                />
                <span>Add Grocery</span>
              </Link>
              <Link
                href="/groceries"
                onClick={() => setOpenSideBar(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#526557] transition hover:bg-[#f5f9f1] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-[#76a85b]">
                <Boxes
                  aria-hidden="true"
                  className="h-4.5 w-4.5 shrink-0 text-[#76a85b]"
                />
                <span>View Grocery</span>
              </Link>
              <Link
                href="/manage-orders"
                onClick={() => setOpenSideBar(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#526557] transition hover:bg-[#f5f9f1] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-[#76a85b]">
                <ClipboardCheck
                  aria-hidden="true"
                  className="h-4.5 w-4.5 shrink-0 text-[#76a85b]"
                />
                <span>Manage Orders</span>
              </Link>
            </nav>

            {/* Logout */}
            <div className="border-t border-[#e8eee3] px-3 py-4">
              <button
                type="button"
                onClick={async () => await signOut({ callbackUrl: "/login" })}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#9c4b3c] transition hover:bg-[#fff4f1] focus-visible:outline-2 focus-visible:outline-[#d98c7c]">
                <LogOut aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e8eee3] bg-white/90 font-sans text-[#183b2b] shadow-[0_8px_28px_-22px_rgba(24,59,43,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link
            href="/"
            aria-label="GroFresh home"
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#76a85b]">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf5dc] text-[#183b2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6">
                <path
                  d="M12 20.5c-4.4-2.8-6.6-6.2-6.6-10.2 0-2.7 1.6-4.5 4-4.5 1.4 0 2.2.8 2.6 2 .5-1.2 1.3-2 2.7-2 2.4 0 4 1.8 4 4.5 0 4-2.2 7.4-6.7 10.2Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 18.5c-.2-4.6.8-7.7 3.3-9.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-[1.35rem] font-extrabold tracking-[-0.07em] sm:text-2xl">
              Gro<span className="text-[#76a85b]">Fresh</span>
            </span>
          </Link>

          {user.role === "user" && (
            <div
              ref={searchContainerRef}
              className={`${
                mobileSearchOpen ? "flex" : "hidden"
              } relative order-3 w-full items-center lg:order-0 lg:mx-6 lg:flex lg:max-w-xl lg:flex-1`}>
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (searchResults.length > 0) {
                    handleSelectSearchItem(searchResults[0]);
                  }
                }}
                className="w-full flex items-center gap-2.5 rounded-full border border-[#e5ecdf] bg-[#f9fbf7] px-4 py-2.5 transition focus-within:border-[#a9c68f] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dcebd0]/60">
                <Search
                  aria-hidden="true"
                  className="h-4.5 w-4.5 shrink-0 text-[#82967b]"
                />
                <span className="relative h-5 min-w-0 flex-1 overflow-hidden">
                  <input
                    type="search"
                    aria-label="Search groceries"
                    value={searchQuery}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchDropdownOpen(true);
                    }}
                    onChange={(event) => {
                      setSearchQuery(event.currentTarget.value);
                      if (event.currentTarget.value.trim()) {
                        setIsSearchDropdownOpen(true);
                      }
                    }}
                    className="absolute inset-0 h-full w-full bg-transparent text-sm text-[#183b2b] outline-none"
                  />
                  {!searchQuery && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 overflow-hidden text-sm leading-5 text-[#98a398]">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={suggestionIndex}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="absolute inset-0 block truncate">
                          {searchSuggestions[suggestionIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  )}
                </span>
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchDropdownOpen(false);
                    }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#71836f] transition hover:bg-[#edf3e8] hover:text-[#284936]">
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="hidden rounded-md border border-[#e1e8dc] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#98a398] sm:inline">
                    Search
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setIsSearchDropdownOpen(false);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#71836f] transition hover:bg-[#edf3e8] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b] lg:hidden">
                  <X aria-hidden="true" className="h-4.5 w-4.5" />
                </button>
              </form>

              {/* Dynamic Search Dropdown List */}
              <AnimatePresence>
                {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-[#e5ecdf] bg-white shadow-[0_20px_50px_-15px_rgba(24,59,43,0.3)]">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between border-b border-[#f0f4ec] bg-[#f9fbf7] px-4 py-2.5 text-xs">
                      <span className="font-bold text-[#183b2b]">
                        {isSearching
                          ? "Searching..."
                          : `${searchResults.length} ${
                              searchResults.length === 1 ? "result" : "results"
                            } for "${searchQuery}"`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(false)}
                        className="text-[11px] font-semibold text-[#718575] hover:text-[#183b2b]">
                        Close
                      </button>
                    </div>

                    {/* Results or Loading or Empty State */}
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-2.5 py-8 text-xs text-[#718575]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#5d8d4c]" />
                        <span>Searching fresh groceries...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#f2f6ee]">
                        {searchResults.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => handleSelectSearchItem(item)}
                            className="group flex cursor-pointer items-center justify-between gap-3 p-3 transition hover:bg-[#f8fbf5]">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#e8eee3] bg-[#f9fbf7]">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="44px"
                                  className="object-contain p-1"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#183b2b] group-hover:text-[#2d5624]">
                                  {item.name}
                                </p>
                                <p className="truncate text-[10px] text-[#718575]">
                                  {item.category}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <p className="text-xs font-extrabold text-[#3f6535]">
                                  ₹{item.price}
                                </p>
                                <p className="text-[10px] text-[#718575]">
                                  per {item.unit}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={(e) =>
                                  handleAddToCartFromSearch(e, item)
                                }
                                className="flex cursor-pointer items-center gap-1 rounded-xl border border-[#dce8d4] bg-[#f0f7ea] px-2.5 py-1 text-xs font-bold text-[#3f6535] transition hover:bg-[#3f6535] hover:text-white active:scale-95">
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-[#718575]">
                        <ShoppingBag className="mx-auto h-7 w-7 text-[#98a398] mb-1.5 opacity-60" />
                        <p className="font-bold text-[#183b2b]">
                          No groceries found for &quot;{searchQuery}&quot;
                        </p>
                        <p className="mt-1 text-[11px] text-[#8a998c]">
                          Try searching for fruits, milk, chips, bread, or rice.
                        </p>
                      </div>
                    )}

                    {/* Footer link to Shop */}
                    <div className="border-t border-[#f0f4ec] bg-[#f9fbf7] px-4 py-2 text-right">
                      <Link
                        href="/shop"
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3f6535] hover:underline">
                        <span>Browse All Groceries</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
            {user.role === "user" && (
              <>
                <button
                  type="button"
                  aria-label={
                    mobileSearchOpen ? "Search is open" : "Open search"
                  }
                  aria-expanded={mobileSearchOpen}
                  onClick={() => setMobileSearchOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8eee3] bg-white text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b] lg:hidden">
                  <Search aria-hidden="true" className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label={`Shopping cart, ${cartQuantity} ${
                    cartQuantity === 1 ? "item" : "items"
                  }`}
                  aria-expanded={isCartOpen}
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex cursor-pointer h-11 w-11 items-center justify-center rounded-full border border-[#e8eee3] bg-white text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                  <ShoppingCart aria-hidden="true" className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#5d8d4c] px-1 text-[10px] font-bold leading-none text-white">
                    {cartQuantity}
                  </span>
                </button>
              </>
            )}

            {user.role === "admin" && (
              <>
                <nav
                  aria-label="Admin navigation"
                  className="hidden items-center gap-1.5 sm:flex">
                  <Link
                    href="/add-grocery"
                    className="flex items-center gap-2 rounded-full border border-[#e8eee3] bg-white px-3.5 py-2 text-sm font-semibold text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                    <PlusCircle
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="hidden lg:inline">Add Grocery</span>
                  </Link>
                  <Link
                    href="/groceries"
                    className="flex items-center gap-2 rounded-full border border-[#e8eee3] bg-white px-3.5 py-2 text-sm font-semibold text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                    <Boxes aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:inline">View Grocery</span>
                  </Link>
                  <Link
                    href="/manage-orders"
                    className="flex items-center gap-2 rounded-full border border-[#e8eee3] bg-white px-3.5 py-2 text-sm font-semibold text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b]">
                    <ClipboardCheck
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="hidden lg:inline">Manage Orders</span>
                  </Link>
                </nav>
                <button
                  type="button"
                  aria-label="Open admin sidebar"
                  onClick={() => setOpenSideBar(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8eee3] bg-white text-[#426e3f] transition hover:border-[#d3e2ca] hover:bg-[#f5f9f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b] sm:hidden">
                  <Menu aria-hidden="true" className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="relative" ref={profileDropdown}>
              <button
                type="button"
                aria-label={`Open account menu for ${user.name}`}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((previousOpen) => !previousOpen)}
                className="flex cursor-pointer h-11 items-center gap-2 rounded-full border border-[#e8eee3] bg-white py-1 px-1 text-left transition hover:border-[#d3e2ca] hover:bg-[#f9fbf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#76a85b] sm:pr-3">
                <span className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf5dc] text-[#547d46]">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <User2 aria-hidden="true" className="h-4.5 w-4.5" />
                  )}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-[#385342] sm:block">
                  {user.name}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`hidden h-4 w-4 text-[#82967b] transition-transform sm:block ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-[#e5ecdf] bg-white p-2 shadow-[0_24px_60px_-25px_rgba(24,59,43,0.45)]">
                    <div className="flex items-center gap-3 rounded-xl bg-[#f6f9f3] p-3">
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e3efd8] text-[#547d46]">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <User2 aria-hidden="true" className="h-5 w-5" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#284936]">
                          {user.name}
                        </span>
                        <span className="block truncate text-xs text-[#7b877f]">
                          {user.email}
                        </span>
                        <span className="mt-1 inline-flex rounded-full bg-[#eaf3e3] px-2 py-0.5 text-[10px] font-semibold text-[#547d46]">
                          {roleLabels[user.role]}
                        </span>
                      </span>
                    </div>

                    {user.role === "admin" && (
                      <Link
                        href="/"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#526557] transition hover:bg-[#f5f9f1] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-[#76a85b]">
                        <LayoutDashboard
                          aria-hidden="true"
                          className="h-4.5 w-4.5"
                        />
                        Admin Dashboard
                      </Link>
                    )}

                    {user.role === "user" && (
                      <Link
                        href="/orders"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#526557] transition hover:bg-[#f5f9f1] hover:text-[#284936] focus-visible:outline-2 focus-visible:outline-[#76a85b]">
                        <Package aria-hidden="true" className="h-4.5 w-4.5" />
                        My orders
                      </Link>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        void signOut({ callbackUrl: "/login" });
                      }}
                      className="flex cursor-pointer w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#9c4b3c] transition hover:bg-[#fff4f1] focus-visible:outline-2 focus-visible:outline-[#d98c7c]">
                      <LogOut aria-hidden="true" className="h-4.5 w-4.5" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {SideBar}
      </header>
      {user.role === "user" && <Cart isOpen={isCartOpen} onClose={closeCart} />}
    </>
  );
};

export default Navbar;
