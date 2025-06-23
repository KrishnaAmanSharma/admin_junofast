import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Package,
  Users,
  UserCheck,
  Settings,
  List,
  HelpCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Orders", href: "/orders", icon: Package },
  { name: "Users", href: "/users", icon: Users },
  { name: "Vendors", href: "/vendors", icon: UserCheck },
  { name: "Service Types", href: "/service-types", icon: Settings },
  { name: "Common Items", href: "/common-items", icon: List },
  { name: "Service Questions", href: "/service-questions", icon: HelpCircle },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-admin-slate">Juno Fast</h1>
        <p className="text-sm text-gray-500">Admin Portal</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-blue-50 text-primary-custom"
                  : "text-gray-700 hover:bg-gray-50"
              )}>
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
