import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Settings,
  ArrowLeft,
  Trash2,
  Play
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import type { Attendee, Game } from '@shared/schema';

interface AttendanceStats {
  attending: number;
  notAttending: number;
  total: number;
  gameStatus: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery<Attendee[]>({
    queryKey: ['/api/attendees'],
  });

  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const { data: activeGame } = useQuery<Game>({
    queryKey: ['/api/game'],
  });

  const { data: stats } = useQuery<AttendanceStats>({
    queryKey: ['/api/stats'],
  });

  // Mutations
  const removeAttendeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/attendees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Attendee removed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove attendee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/attendees');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "All attendance cleared successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear attendance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const setActiveGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/activate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Success",
        description: "Active game updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update active game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveAttendee = (id: number) => {
    if (confirm('Remove this person from attendance?')) {
      removeAttendeeMutation.mutate(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all attendance? This cannot be undone.')) {
      clearAllMutation.mutate();
    }
  };

  const handleSetActiveGame = (gameId: number) => {
    if (confirm('Switch to this game? This will become the active game for attendance.')) {
      setActiveGameMutation.mutate(gameId);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Team View
                </Button>
              </Link>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Manage games and attendance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Current Game & Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Game */}
          {activeGame && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
                <CardTitle className="text-lg flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Active Game
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Opponent</span>
                    <span className="font-semibold">{activeGame.opponent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Location</span>
                    <span className="font-semibold">{activeGame.homeAway === 'home' ? 'Home' : 'Away'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Date</span>
                    <span className="font-semibold">{activeGame.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Time</span>
                    <span className="font-semibold">{activeGame.time}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Stats */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {stats && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-green-600">{stats.attending}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900">Attending</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-red-600">{stats.notAttending}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900">Not Attending</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-gray-600">{stats.total}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900">Total</p>
                    </div>
                  </div>
                  
                  <Alert className={stats.attending >= 7 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                    <CheckCircle className={`w-4 h-4 ${stats.attending >= 7 ? "text-green-600" : "text-amber-600"}`} />
                    <AlertDescription className={stats.attending >= 7 ? "text-green-800" : "text-amber-800"}>
                      <span className="font-medium text-sm">{stats.gameStatus}</span>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Game Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">Manage active game and view schedule</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {games.map((game) => (
                <div key={game.id} className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${
                  game.opponent.includes('Holiday') ? 'bg-orange-50 border-l-4 border-orange-400' : ''
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {game.opponent.includes('Holiday') ? 
                            game.opponent : 
                            `Concrete Crushers (${game.homeAway === 'home' ? 'H' : 'A'}) vs ${game.opponent} (${game.homeAway === 'home' ? 'A' : 'H'})`
                          }
                        </span>
                        {game.isActive && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                        {game.opponent.includes('Holiday') && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Holiday</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {game.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {game.time}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {game.field}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!game.isActive && !game.opponent.includes('Holiday') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActiveGame(game.id)}
                        disabled={setActiveGameMutation.isPending}
                      >
                        Set Active
                      </Button>
                    )}
                    {!game.isActive && game.opponent.includes('Holiday') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActiveGame(game.id)}
                        disabled={setActiveGameMutation.isPending}
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                      >
                        Set as Current Week
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendees Management */}
        <Card>
          <CardHeader>
            <CardTitle>Current Attendees</CardTitle>
            <p className="text-sm text-muted-foreground">Manage individual attendance</p>
          </CardHeader>
          <CardContent className="p-0">
            {attendeesLoading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : attendees.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No attendance records yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(attendee.firstName, attendee.lastName)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {attendee.firstName} {attendee.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getTimeAgo(new Date(attendee.checkedInAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={attendee.status === 'in' ? 'default' : 'secondary'}>
                        {attendee.status === 'in' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Attending
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Attending
                          </>
                        )}
                      </Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveAttendee(attendee.id)}
                        disabled={removeAttendeeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}