import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { TeamMember, Attendee, Game } from '@shared/schema';

interface AttendanceStats {
  attending: number;
  notAttending: number;
  total: number;
  gameStatus: string;
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Queries
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery<Attendee[]>({
    queryKey: ['/api/attendees'],
  });

  const { data: game } = useQuery<Game>({
    queryKey: ['/api/game'],
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ['/api/stats'],
  });

  const { data: rosterData = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/roster'],
  });

  // Sort roster alphabetically by last name, then first name
  const roster = [...rosterData].sort((a, b) => {
    if (a.lastName !== b.lastName) {
      return a.lastName.localeCompare(b.lastName);
    }
    return a.firstName.localeCompare(b.firstName);
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: async ({ firstName, lastName, status }: { firstName: string; lastName: string; status: string }) => {
      const response = await apiRequest('POST', '/api/attendees', {
        firstName,
        lastName,
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Attendance updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRosterCheckIn = (member: TeamMember, status: string) => {
    checkInMutation.mutate({
      firstName: member.firstName,
      lastName: member.lastName,
      status
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (attendeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading attendance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Game Info Card */}
        {game && (
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold text-white">Next Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <h3 className="font-semibold text-sm opacity-90">MATCHUP</h3>
                  <p className="text-lg font-bold">Crushers vs {game.opponent}</p>
                  <p className="text-sm opacity-75">{game.homeAway.toUpperCase()}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm opacity-90">DATE & TIME</h3>
                  <p className="text-lg font-bold">{game.date}</p>
                  <p className="text-sm opacity-75">{game.time}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm opacity-90">LOCATION</h3>
                  <p className="text-lg font-bold">{game.field}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">{stats.attending} In</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">{stats.notAttending} Out</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">{roster.length - stats.total} No Response</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Attendance Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Roster & Attendance
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Check in/out for the next game
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-medium">active</span>
                <span className="text-xs">(Need 10 minimum)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!game ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No active game</p>
                <p className="text-sm">Check the schedule for upcoming games.</p>
                <Badge variant="secondary" className="mt-2">
                  {game.opponent}
                </Badge>
              </div>
            ) : roster.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No team members in roster. Visit the Roster tab to add members.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {roster.map((member) => {
                  const attendance = attendees.find(a => 
                    a.firstName === member.firstName && a.lastName === member.lastName
                  );
                  const status = attendance?.status;
                  
                  return (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
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
                            <Badge variant={member.isActive ? 'default' : 'secondary'} className="text-xs">
                              {member.isActive ? 'Active' : 'Alternate'}
                            </Badge>
                            {status && (
                              <span className="text-xs text-gray-500">
                                {(status === 'attending' || status === 'in') ? 'Checked in' : 'Checked out'} {getTimeAgo(new Date(attendance.checkedInAt))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className={(status === 'attending' || status === 'in') ? 
                            'bg-green-100 text-green-700 border-green-300' : 
                            'hover:bg-green-50 hover:text-green-700'
                          }
                          onClick={() => handleRosterCheckIn(member, 'attending')}
                          disabled={checkInMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          In
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={(status === 'not_attending' || status === 'out') ? 
                            'bg-red-100 text-red-700 border-red-300' : 
                            'hover:bg-red-50 hover:text-red-700'
                          }
                          onClick={() => handleRosterCheckIn(member, 'not_attending')}
                          disabled={checkInMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Out
                        </Button>
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
