import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../cache';

describe('SearchService', () => {
  let service: SearchService;

  const mockPrismaService = {
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      findMany: jest.fn(),
    },
    searchIndex: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    savedSearch: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockCacheService = {
    getOrSet: jest.fn(),
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fullTextSearch', () => {
    it('should perform full-text search on tasks', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Website Development',
          description: 'Build a modern website',
          category: 'development',
          status: 'open',
        },
        {
          id: '2',
          title: 'Mobile App Development',
          description: 'Create a mobile application',
          category: 'development',
          status: 'open',
        },
      ];

      // Setup cache to execute the callback
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return fn();
      });

      // Mock the two $queryRaw calls
      mockPrismaService.$queryRaw
        .mockReturnValueOnce(Promise.resolve(mockTasks))
        .mockReturnValueOnce(Promise.resolve([{ count: BigInt(2) }]));

      const result = await service.fullTextSearch('development', {
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.tasks).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should handle empty search query', async () => {
      const result = await service.fullTextSearch('', {
        limit: 10,
        offset: 0,
      });

      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should tokenize search query correctly', () => {
      const tokens = service.tokenize('website development project');
      
      expect(tokens).toContain('website');
      expect(tokens).toContain('development');
      expect(tokens).toContain('project');
    });
  });

  describe('advancedSearch', () => {
    it('should filter tasks by multiple criteria', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Website Development',
          category: 'development',
          status: 'open',
          requirements: JSON.stringify({ budget: { min: 5000, max: 10000 } }),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const filters = {
        category: 'development',
        status: 'open',
        budgetMin: 5000,
        budgetMax: 10000,
      };

      const result = await service.advancedSearch(filters);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'development',
            status: 'open',
          }),
        })
      );
    });

    it('should filter by skills', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Full-stack Development',
          requirements: JSON.stringify({
            skills: ['React', 'Node.js', 'TypeScript'],
          }),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const filters = {
        skills: ['React', 'Node.js'],
      };

      const result = await service.advancedSearch(filters);

      expect(result).toBeDefined();
    });

    it('should filter by date range', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Recent Task',
          createdAt: new Date('2024-01-15'),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const filters = {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-01-31'),
      };

      const result = await service.advancedSearch(filters);

      expect(result).toBeDefined();
    });

    it('should support pagination', async () => {
      const mockTasks = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
      }));

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks.slice(0, 10));
      mockPrismaService.task.count.mockResolvedValue(25);

      const result = await service.advancedSearch({}, { page: 1, limit: 10 });

      expect(result).toHaveLength(10);
    });
  });

  describe('fuzzySearch', () => {
    it('should find similar tasks using fuzzy matching', async () => {
      const mockTasks = [
        { id: '1', title: 'Website Development' },
        { id: '2', title: 'Web Development Project' },
        { id: '3', title: 'Mobile App' },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.fuzzySearch('web develop', 0.5);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate Levenshtein distance correctly', () => {
      const similarity = service.calculateSimilarity('kitten', 'sitting');
      
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });

    it('should return perfect match for identical strings', () => {
      const similarity = service.calculateSimilarity('exact match', 'exact match');
      
      expect(similarity).toBe(1);
    });

    it('should return zero for completely different strings', () => {
      const similarity = service.calculateSimilarity('abc', 'xyz');
      
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search with embeddings (mock)', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Build a REST API',
          description: 'Create backend services',
          embedding: JSON.stringify([0.1, 0.2, 0.3]),
        },
        {
          id: '2',
          title: 'Frontend Development',
          description: 'Build user interfaces',
          embedding: JSON.stringify([0.4, 0.5, 0.6]),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      // Mock embedding generation
      jest.spyOn(service, 'generateEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await service.semanticSearch('backend development');

      expect(result).toBeDefined();
    });

    it('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const vec3 = [0, 1, 0];

      const similarity1 = service.cosineSimilarity(vec1, vec2);
      const similarity2 = service.cosineSimilarity(vec1, vec3);

      expect(similarity1).toBe(1);
      expect(similarity2).toBe(0);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions based on input', async () => {
      const mockTasks = [
        { title: 'Website Development' },
        { title: 'Web Design' },
        { title: 'Mobile Development' },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const suggestions = await service.getSuggestions('web');

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('web'))).toBe(true);
    });

    it('should limit number of suggestions', async () => {
      const mockTasks = Array.from({ length: 20 }, (_, i) => ({
        title: `Task ${i}`,
      }));

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const suggestions = await service.getSuggestions('task', 5);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('saveSearch', () => {
    it('should save search criteria for user', async () => {
      const searchCriteria = {
        query: 'development',
        filters: { category: 'tech' },
      };

      mockPrismaService.savedSearch.create.mockResolvedValue({
        id: 'search-1',
        agentId: 'agent-1',
        name: 'My Search',
        query: searchCriteria.query,
        filters: JSON.stringify(searchCriteria.filters),
      });

      const result = await service.saveSearch('agent-1', 'My Search', searchCriteria);

      expect(result).toBeDefined();
      expect(result.id).toBe('search-1');
      expect(mockPrismaService.savedSearch.create).toHaveBeenCalled();
    });
  });

  describe('cache optimization', () => {
    it('should cache popular search results', async () => {
      const mockTasks = [{ id: '1', title: 'Popular Task' }];

      mockCacheService.getOrSet.mockResolvedValue({
        tasks: mockTasks,
        total: 1,
      });

      const result = await service.fullTextSearch('popular', { limit: 10 });

      expect(mockCacheService.getOrSet).toHaveBeenCalled();
      expect(result.tasks).toEqual(mockTasks);
    });

    it('should invalidate cache when tasks are updated', async () => {
      await service.invalidateSearchCache();

      expect(mockCacheService.invalidate).toHaveBeenCalledWith('search:*');
    });
  });

  describe('performance', () => {
    it('should handle large result sets efficiently', async () => {
      const mockTasks = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        title: `Task ${i}`,
      }));

      // Reset mocks
      mockPrismaService.$queryRaw.mockReset();
      mockCacheService.getOrSet.mockReset();

      // Setup cache to execute the callback
      mockCacheService.getOrSet.mockImplementation(async (_key, fn) => {
        return fn();
      });

      // Setup database mocks
      mockPrismaService.$queryRaw
        .mockReturnValueOnce(Promise.resolve(mockTasks))
        .mockReturnValueOnce(Promise.resolve([{ count: BigInt(1000) }]));

      const startTime = Date.now();
      const result = await service.fullTextSearch('task', { limit: 50 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
      expect(result.tasks.length).toBe(50);
      expect(result.total).toBe(1000);
    });
  });
});
