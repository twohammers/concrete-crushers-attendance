import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Calendar
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Attendee, Game, TeamMember } from '@shared/schema';

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

  // Update current time every minute
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
      timeZone: 'America/Los_Angeles'
    }).format(date) + ' PST';
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return 'More than a day ago';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Compact Next Game Info */}
        {game && (
          <Card className="overflow-hidden">
            <CardHeader className={`py-3 ${game.opponent.includes('Holiday') ? 
              "bg-gradient-to-r from-orange-500 to-red-500 text-white" : 
              "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground"
            }`}>
              <CardTitle className="text-lg text-center">
                {game.opponent.includes('Holiday') ? 'Holiday Week' : 'Next Game'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              {game.opponent.includes('Holiday') ? (
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{game.opponent}</h3>
                  <p className="text-sm text-gray-600">{game.date}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Matchup</p>
                    <p className="font-semibold text-sm">Crushers vs {game.opponent}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {game.homeAway === 'home' ? 'HOME' : 'AWAY'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Date & Time</p>
                    <p className="font-semibold text-sm">{game.date}</p>
                    <p className="text-sm text-gray-700">{game.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Location</p>
                    <p className="font-semibold text-sm">{game.field}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Team Roster with Attendance */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Roster & Attendance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {game?.opponent.includes('Holiday') ? 
                    'No game this week - enjoy the holiday!' : 
                    'Check in/out for the next game'
                  }
                </p>
              </div>
              {stats && !game?.opponent.includes('Holiday') && (
                <div className="text-right">
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>{stats.attending} In</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>{stats.notAttending} Out</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>{roster.length - stats.total} No Response</span>
                    </div>
                  </div>
                  <Alert className={stats.attending >= 10 ? "border-green-200 bg-green-50 p-2" : "border-amber-200 bg-amber-50 p-2"}>
                    <CheckCircle className={`w-4 h-4 ${stats.attending >= 10 ? "text-green-600" : "text-amber-600"}`} />
                    <AlertDescription className={`text-xs ${stats.attending >= 10 ? "text-green-800" : "text-amber-800"}`}>
                      <span className="font-medium">{stats.gameStatus}</span> (Need 10 minimum)
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {game?.opponent.includes('Holiday') ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Holiday Week</h3>
                <p className="text-gray-600 mb-4">No games scheduled this week. Check back next week!</p>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
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
