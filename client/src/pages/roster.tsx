import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  UserPlus,
  Trash2,
  Edit3
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { TeamMember, Attendee } from '@shared/schema';

export default function Roster() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: roster = [], isLoading: rosterLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/roster'],
  });

  const { data: attendees = [] } = useQuery<Attendee[]>({
    queryKey: ['/api/attendees'],
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
      const response = await apiRequest('POST', '/api/roster', {
        firstName,
        lastName,
        isActive: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
      setFirstName('');
      setLastName('');
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Team member added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/roster/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
      toast({
        title: "Success",
        description: "Team member removed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    },
  });



  const handleAddMember = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both first and last name.",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  const handleRemoveMember = (id: number) => {
    if (confirm('Remove this team member? They will no longer appear in the roster.')) {
      removeMemberMutation.mutate(id);
    }
  };

  const getGamesPlayed = (member: TeamMember) => {
    // Count unique games where this member checked in as 'in'
    const memberAttendances = attendees.filter(a => 
      a.firstName === member.firstName && 
      a.lastName === member.lastName && 
      a.status === 'in'
    );
    return memberAttendances.length;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (rosterLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading team roster...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Roster</h1>
            <p className="text-gray-600">Manage team members and quick check-in</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="addFirstName">First Name</Label>
                  <Input
                    id="addFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="addLastName">Last Name</Label>
                  <Input
                    id="addLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddMember}
                    disabled={addMemberMutation.isPending}
                  >
                    Add Member
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({roster.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {roster.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No team members yet</p>
                <p className="text-sm">Add your first team member to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {roster.map((member) => {
                  return (
                    <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(member.firstName, member.lastName)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={member.isActive ? 'default' : 'secondary'}>
                                {member.isActive ? 'Active' : 'Alternate'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Games Played</p>
                            <p className="text-lg font-semibold text-primary">{getGamesPlayed(member)}</p>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}