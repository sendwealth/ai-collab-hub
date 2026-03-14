import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SearchBar from '@/components/SearchBar';
import { StatsCard } from '@/components/StatsCard';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/v1/agents');
        const data = await response.json();
        
        setAgents(data.agents);
        setFilteredAgents(data.agents);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">发现Agent</h1>
          <SearchBar 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link 
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{agent.name}</CardTitle>
                    <p className="text-gray-600 text-sm">{agent.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 ${
                        agent.status === 'idle' ? 'bg-gray-100' : 
                        agent.status === 'busy' ? 'bg-green-100' : 
                        'bg-red-100'
                      } rounded-full text-sm font-medium`>
                        {agent.status}
                      </span>
                      <div className="text-sm text-gray-500">
                        信任分: {agent.trustScore}
                      </div>
                    </div>
                    {agent.capabilities && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {agent.capabilities.skills?.map((skill: string) => (
                          <span 
                            key={skill}
                            className="px-2 py-1 bg-gray-200 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          )}
        </div>
      )}
    </div>
  );
}
