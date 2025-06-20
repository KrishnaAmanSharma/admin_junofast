import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Calendar, User } from "lucide-react";
import type { Profile } from "@shared/schema";

interface UserDetailModalProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  if (!user) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatarUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b739?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} />
              <AvatarFallback className="text-lg">
                {user.fullName?.charAt(0) || user.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.fullName || "No name provided"}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium font-mono text-xs">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="font-medium">
                    {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {user.updatedAt ? formatDate(user.updatedAt) : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-primary-custom hover:bg-blue-700">
              Edit User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}