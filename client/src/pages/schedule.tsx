import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { Game } from '@shared/schema';

export default function Schedule() {
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const { data: activeGame } = useQuery<Game>({
    queryKey: ['/api/game'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading schedule...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">2025 Season Schedule</h1>
          <p className="text-gray-600">Concrete Crushers Softball Team</p>
        </div>

        <div className="grid gap-4">
          {games.map((game, index) => (
            <Card key={game.id} className={`overflow-hidden transition-all ${
              game.isActive ? 'ring-2 ring-primary shadow-lg' : ''
            } ${game.opponent.includes('Holiday') ? 'bg-orange-50 border-orange-200' : ''}`}>
              <CardHeader className={`pb-3 ${
                game.isActive ? 'bg-primary text-primary-foreground' : 
                game.opponent.includes('Holiday') ? 'bg-orange-100' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-sm font-medium px-2 py-1 bg-white/20 rounded">
                      Week {index + 1}
                    </span>
                    {game.isActive && (
                      <Badge variant="secondary" className="bg-white text-primary">
                        Current Game
                      </Badge>
                    )}
                    {game.opponent.includes('Holiday') && (
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        Holiday
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        game.opponent.includes('Holiday') ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        <Users className={`w-4 h-4 ${
                          game.opponent.includes('Holiday') ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {game.opponent.includes('Holiday') ? 'Status' : 'Matchup'}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {game.opponent.includes('Holiday') ? 
                            game.opponent : 
                            `Concrete Crushers (${game.homeAway === 'home' ? 'H' : 'A'}) vs ${game.opponent} (${game.homeAway === 'home' ? 'A' : 'H'})`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Location</p>
                        <p className="font-semibold text-gray-900">{game.field}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">{game.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Time</p>
                        <p className="font-semibold text-gray-900">{game.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}