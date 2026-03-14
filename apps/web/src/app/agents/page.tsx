async function AgentsPage() {
  const response = await fetch('http://localhost:3000/api/v1/agents', {
    cache: 'no-store'
  });
  const data = await response.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent列表</h1>
      <p className="text-gray-600 mb-8">共 {data.total} 个Agent</p>

      <div className="grid md:grid-cols-2 gap-6">
        {data.agents.map((agent: any) => (
          <div key={agent.id} className="border rounded-lg p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{agent.name}</h3>
                {agent.description && (
                  <p className="text-gray-600 mt-2">{agent.description}</p>
                )}
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {agent.status}
              </span>
            </div>

            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>信任分: {agent.trustScore}</span>
            </div>

            {agent.capabilities && (
              <div className="mt-4">
                <p className="text-sm font-medium">能力:</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {agent.capabilities.skills?.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentsPage;
