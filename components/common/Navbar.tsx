import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', false);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const navLinks = [
    {
      href: "/",
      label: "Dashboard",
      icon: HomeIcon,
      show: true,
      roles: ["client", "shopper"],
    },
    {
      href: "/create-list",
      label: "Create List",
      icon: PlusCircleIcon,
      show: profile?.user_type === "client",
      roles: ["client"],
    },
    {
      href: "/my-lists",
      label: "My Lists",
      icon: ClipboardDocumentListIcon,
      show: profile?.user_type === "client", // Only show for clients
      roles: ["client"],
    },
    {
      href: "/my-bids",
      label: "My Bids",
      icon: DocumentTextIcon,
      show: profile?.user_type === "shopper",
      roles: ["shopper"],
    },
    {
      href: "/messages",
      label: "Messages",
      icon: ChatBubbleLeftRightIcon,
      show: true,
      roles: ["client", "shopper"],
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: BellIcon,
      show: true,
      roles: ["client", "shopper"],
      badge: unreadCount,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: UserIcon,
      show: true,
      roles: ["client", "shopper"],
    },
  ];

  const visibleLinks = navLinks.filter((link) => link.show);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-white shadow-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Shopper
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                const hasBadge = link.badge && link.badge > 0;

                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        active
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {hasBadge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                          >
                            {link.badge > 99 ? '99+' : link.badge}
                          </motion.span>
                        )}
                      </div>
                      <span className="font-medium">{link.label}</span>
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {/* Sign Out Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="ml-2 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Sign Out</span>
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-gray-700" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-gray-700" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white shadow-lg overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  const hasBadge = link.badge && link.badge > 0;

                  return (
                    <Link key={link.href} href={link.href}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                          active
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Icon className="w-5 h-5" />
                            {hasBadge && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {link.badge > 99 ? '99+' : link.badge}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{link.label}</span>
                        </div>
                        {active && (
                          <motion.div
                            layoutId="activeMobileNav"
                            className="w-1 h-6 bg-blue-600 rounded-full"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}

                {/* Sign Out Button in Mobile */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}