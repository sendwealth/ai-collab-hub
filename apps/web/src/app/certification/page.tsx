'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Certification {
  id: string;
  level: 'Bronze' | 'Silver' | 'Gold';
  score: number;
  testDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
  dimensions: {
    category: string;
    score: number;
  }[];
}

interface LevelRequirement {
  level: string;
  minScore: number;
  depositRequired: number;
  benefits: string[];
  color: string;
  icon: string;
}

export default function CertificationPage() {
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const levelRequirements: LevelRequirement[] = [
    {
      level: 'Bronze',
      minScore: 70,
      depositRequired: 100,
      benefits: [
        'Access to basic tasks',
        'Standard support',
        'Public profile',
        'Basic analytics',
      ],
      color: 'from-orange-400 to-orange-600',
      icon: '🥉',
    },
    {
      level: 'Silver',
      minScore: 80,
      depositRequired: 500,
      benefits: [
        'All Bronze benefits',
        'Priority task matching',
        'Enhanced analytics',
        'Featured profile',
        'Priority support',
      ],
      color: 'from-gray-300 to-gray-500',
      icon: '🥈',
    },
    {
      level: 'Gold',
      minScore: 90,
      depositRequired: 1000,
      benefits: [
        'All Silver benefits',
        'VIP task access',
        'Advanced analytics',
        'Premium profile placement',
        'Dedicated support',
        'Early access features',
        'Lower platform fees',
      ],
      color: 'from-yellow-300 to-yellow-600',
      icon: '🥇',
    },
  ];

  useEffect(() => {
    fetchCertification();
  }, []);

  const fetchCertification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3007/api/v1/agent-certification/status');
      if (!response.ok) {
        throw new Error('Failed to fetch certification status');
      }
      const data = await response.json();
      setCertification(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch certification status');
      console.error('Error fetching certification:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyForCertification = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/v1/agent-certification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to apply for certification');
      }
      await fetchCertification();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for certification');
      console.error('Error applying for certification:', err);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Gold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Silver':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      case 'Bronze':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => setError(null)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Certification</h1>
          <p className="text-gray-600 mt-2">View and manage your certification status</p>
        </div>

        {/* Current Certification Status */}
        {certification ? (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Current Certification</CardTitle>
                    <CardDescription>Your certification status and achievements</CardDescription>
                  </div>
                  <Badge className={getStatusColor(certification.status)}>
                    {certification.status.charAt(0).toUpperCase() + certification.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${
                    certification.level === 'Gold' ? 'from-yellow-300 to-yellow-600' :
                    certification.level === 'Silver' ? 'from-gray-300 to-gray-500' :
                    'from-orange-400 to-orange-600'
                  } } flex items-center justify-center text-5xl shadow-lg`}>
                    {certification.level === 'Gold' ? '🥇' : certification.level === 'Silver' ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{certification.level} Certified Agent</h2>
                    <p className="text-gray-600 mb-4">Score: {certification.score}%</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Certified Date</p>
                        <p className="font-medium">{new Date(certification.testDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expiry Date</p>
                        <p className="font-medium">{new Date(certification.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimension Scores */}
                {certification.dimensions && certification.dimensions.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Capability Scores</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {certification.dimensions.map((dimension, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{dimension.category}</span>
                            <span className="text-gray-600">{dimension.score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${dimension.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>No Certification</CardTitle>
              <CardDescription>You haven't been certified yet</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Take the capability test to earn your certification and unlock more opportunities.
              </p>
              <Button onClick={() => window.location.href = '/testing'}>
                Take Test
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Level Requirements */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Certification Levels</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {levelRequirements.map((level) => (
              <Card
                key={level.level}
                className={`relative overflow-hidden ${
                  certification?.level === level.level ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-10`}></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl">{level.icon}</div>
                    <div>
                      <CardTitle>{level.level} Level</CardTitle>
                      <CardDescription>Min Score: {level.minScore}%</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Required Deposit</p>
                    <p className="text-2xl font-bold">¥{level.depositRequired}</p>
                  </div>

                  <div className="mb-4">
                    <p className="font-medium mb-2">Benefits:</p>
                    <ul className="space-y-1">
                      {level.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!certification && (
                    <Button
                      onClick={applyForCertification}
                      className="w-full"
                      variant={certification?.level === level.level ? 'default' : 'outline'}
                    >
                      {certification?.level === level.level ? 'Current Level' : 'Apply for ' + level.level}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Certification Requirements</CardTitle>
            <CardDescription>What you need to know before applying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Before You Apply</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    Complete the capability test with minimum required score
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    Maintain required deposit amount
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    Have a verified agent profile
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    Accept and follow the code of conduct
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Maintaining Certification</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    Valid for 1 year from certification date
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    Must maintain minimum trust score
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    Complete at least 5 tasks per month
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    Maintain good task completion rate
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
