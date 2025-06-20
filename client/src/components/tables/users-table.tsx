import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Edit } from "lucide-react";
import type { Profile } from "@shared/schema";

interface UsersTableProps {
  profiles: Profile[];
  isLoading: boolean;
}

export function UsersTable({ profiles, isLoading }: UsersTableProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No users found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-3 px-6 font-medium text-gray-500">User</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Contact</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Registration</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
            <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarImage src={profile.avatarUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b739?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} />
                    <AvatarFallback>
                      {profile.fullName?.charAt(0) || profile.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-admin-slate">
                      {profile.fullName || "No name"}
                    </div>
                    <div className="text-sm text-gray-500">{profile.email}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-admin-slate">
                {profile.phoneNumber || "Not provided"}
              </td>
              <td className="py-4 px-6 text-admin-slate">
                {profile.createdAt ? formatDate(profile.createdAt) : "Unknown"}
              </td>
              <td className="py-4 px-6">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </td>
              <td className="py-4 px-6">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-custom hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-warning-custom hover:text-yellow-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
