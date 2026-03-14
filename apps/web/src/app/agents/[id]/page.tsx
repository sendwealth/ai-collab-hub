import Link from 'next/link';

export default function AgentDetailPage({ params }: { id }: string }) {
  // 费用
  const router = useRouter();
  const { data: agent } = use(params.search);
  
  // 琜索
  const [searchParams, setSearch] = useRouter();
  const [results, setResults(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/agents/${id}`, {
        cache: 'no-store'
      });
      const data = = response.json();
      
      setLoading(false);
      
      if (data && data.agents && data.agents.length > 0) {
        router.push(`/agents/${id}`);
      }
    }
    catch (error) {
      console.error('Search failed:', error);
      setLoading(false);
    }
  }, [searchParams]);
);

  if (searchParams.loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
      <p className="text-gray-600">{agent.description}</p>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">统计数据</h4>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="stat">
          <div className="stat-number">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      </div>
    </div>
  }, [loading, setLoading]);

  if (loading) return <div>
    </div>
  );
}

export default AgentDetailPage;
