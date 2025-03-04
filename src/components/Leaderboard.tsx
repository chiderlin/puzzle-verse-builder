
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LeaderboardEntry = {
  id: string;
  total_score: number;
  display_name?: string;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log("Fetching leaderboard data...");
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, total_score, display_name')
          .order('total_score', { ascending: false })
          .limit(10);  // Added back the limit(10)

        if (profilesError) {
          console.error('Profiles error:', profilesError);
          throw profilesError;
        }

        console.log("Raw profiles data:", profiles);

        // Ensure we have data and it's an array
        if (!profiles || !Array.isArray(profiles)) {
          console.log("No profiles data or invalid format");
          setLeaderboard([]);
          return;
        }

        // Format display names, using "Anonymous Player #ID" for null display_names
        const formattedLeaderboard = profiles.map((profile) => {
          const entry = {
            id: profile.id,
            total_score: profile.total_score || 0, // Ensure we show 0 for null scores
            display_name: profile.display_name || `Anonymous Player #${profile.id.slice(0, 4)}`
          };
          console.log("Formatted entry:", entry);
          return entry;
        });

        console.log("Final leaderboard data:", formattedLeaderboard);
        setLeaderboard(formattedLeaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to changes in the profiles table
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => {
          console.log("Realtime update received:", payload);
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Top 10 Gamer</h2>
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded"></div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-slate-600 text-center py-4">No players found</div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${
                  index === 0 ? 'bg-yellow-400 text-white' :
                  index === 1 ? 'bg-slate-300 text-white' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-slate-200 text-slate-600'
                } font-bold text-sm`}>
                  {index + 1}
                </span>
                <span className="font-medium text-slate-900">
                  {entry.display_name}
                </span>
              </div>
              <span className="font-bold text-lime-600">{entry.total_score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
