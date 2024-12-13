"use client"

import Link from "next/link"
import MCTable from "./op.png"
import { LayoutDashboard, LaptopMinimal, Tablet, TabletSmartphone, Settings, LogOut, House, Warehouse, Menu, ListOrdered, ChevronUp, ChevronDown, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"


export default function Sidebar() {
  const user = "Playa Bowls"
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userType, setUserType] = useState("Restaurant")

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const navigationItems = userType === "Restaurant" 
    ? [
        { name: "Front of House", href: "/front-of-house", icon: House },
        { name: "Back of House", href: "/back-of-house", icon: Warehouse },
        { name: "mC-Connects", href: "/mc-connects", icon: LaptopMinimal },
        { name: "Tablet Gateways", href: "/tablet-gateways", icon: Tablet },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    : [
        { name: "Order", href: "/order", icon: ListOrdered },
      ]

  return (
    <>
      {/* Mobile Menu Button - only shows on mobile when sidebar is closed */}
      <button 
        className={`lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md hover:bg-gray-100 ${
          isOpen ? 'hidden' : 'block'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Dark Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - modified for responsive design */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 border-r bg-white p-6
        h-[100dvh] lg:h-screen
        transform transition-transform duration-200 ease-in-out
        lg:transform-none
        overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Inner container for flexible content */}
        <div className="flex flex-col h-full">
          {/* Logo section - stays at top */}
          <div className="mb-5 flex items-center gap-3">
            <Image 
              src={MCTable} 
              alt="MC Table Logo" 
              width={30} 
              height={30}
            />
            <div>
              <h1 className="text-xl font-bold">mC-Connect</h1>
              <p className="text-gray-500 font-bold">Table</p>
            </div>
          </div>

          <Separator />

          <nav className="flex-1 space-y-2 mt-6">
            {navigationItems.map((item) => (
              <Link key={item.name} href={item.href} onClick={handleLinkClick}>
                <Button variant="ghost" className={`w-full justify-start text-gray-500 hover:text-black hover:bg-blue-100 ${
                  pathname === item.href ? 'bg-blue-200 text-black font-bold' : ''
                }`}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Bottom section - updated with dropdown */}
          <div className="mt-auto pt-4 pb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-gray-500 hover:text-black hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span>{userType}</span>
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-full" 
                align="end" 
                side="top" 
                sideOffset={12}
              >
                <DropdownMenuItem onClick={() => setUserType("Restaurant")}>
                  <span>Restaurant</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserType("Customer")}>
                  <span>Customer</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}