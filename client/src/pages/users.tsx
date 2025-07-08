import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersTable } from "@/components/tables/users-table";
import { UserDetailModal } from "@/components/modals/user-detail-modal";
import { EditUserModal } from "@/components/modals/edit-user-modal";
import { UserPlus } from "lucide-react";
import type { Profile } from "@shared/schema";
import { supabaseStorage } from "@/lib/supabase-client";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ["profiles", { search: searchTerm }],
    queryFn: () => supabaseStorage.getProfiles(searchTerm),
  });



  const handleSearch = () => {
    // Search is handled by the query key dependency
  };

  const handleViewUser = (profile: Profile) => {
    setSelectedUser(profile);
    setIsViewModalOpen(true);
  };

  const handleEditUser = (profile: Profile) => {
    setSelectedUser(profile);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setSelectedUser(null);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
  };

  return (
    <div>
      <Header title="User Management" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-admin-slate">User Management</h2>
          <Button className="bg-primary-custom hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="max-w-md">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2">
                Search Users
              </Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-admin-slate mb-4">All Users</h3>
            <UsersTable 
              profiles={profiles || []} 
              isLoading={isLoading}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
            />
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={isViewModalOpen}
          onClose={handleCloseModals}
        />

        {/* Edit User Modal */}
        <EditUserModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseModals}
        />
      </div>
    </div>
  );
}
