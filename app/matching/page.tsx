"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  MapPin,
  Building2,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobMatch {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  jobType: string | null;
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  matchScore: number;
  hasApplied: boolean;
  createdAt: string;
}

interface Filters {
  locations: string[];
  industries: string[];
  jobTypes: string[];
}

export default function MatchingPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  useEffect(() => {
    fetchMatches();
  }, [selectedLocation, selectedJobType, selectedIndustry]);

  async function fetchMatches() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedLocation) params.set("location", selectedLocation);
      if (selectedJobType) params.set("jobType", selectedJobType);
      if (selectedIndustry) params.set("industry", selectedIndustry);

      const response = await fetch(`/api/candidate/matches?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job matches");
      }
      const data = await response.json();
      setMatches(data.matches || []);
      if (!filters) {
        setFilters(data.filters);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Filter matches by search query
  const filteredMatches = matches.filter((match) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.title.toLowerCase().includes(query) ||
      match.company.name.toLowerCase().includes(query) ||
      match.description?.toLowerCase().includes(query)
    );
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-warning";
    return "text-muted-foreground";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-success/10";
    if (score >= 70) return "bg-primary/10";
    if (score >= 50) return "bg-warning/10";
    return "bg-muted";
  };

  if (loading && matches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchMatches}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Job Matches
        </h1>
        <p className="text-muted-foreground">
          Discover opportunities that match your skills and experience
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {filters?.locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {filters?.jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                {filters?.industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 rounded-full bg-secondary mb-3">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No matching jobs found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or updating your profile skills
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredMatches.length} job{filteredMatches.length !== 1 ? 's' : ''} matched to your profile
          </p>

          {filteredMatches.map((match) => (
            <Card key={match.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getScoreBg(match.matchScore)} shrink-0`}>
                        <TrendingUp className={`h-5 w-5 ${getScoreColor(match.matchScore)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{match.title}</h3>
                          {match.hasApplied && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{match.company.name}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {match.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.location}
                            </span>
                          )}
                          {match.jobType && (
                            <Badge variant="outline">
                              {match.jobType.charAt(0).toUpperCase() + match.jobType.slice(1)}
                            </Badge>
                          )}
                          {match.company.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {match.company.industry}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(match.createdAt)}
                          </span>
                        </div>

                        {match.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {match.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                    <div className="text-center lg:text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(match.matchScore)}`}>
                        {match.matchScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Match Score</div>
                    </div>

                    {!match.hasApplied && (
                      <Button size="sm">
                        Express Interest
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
