
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LeaderboardEntry = {
  id: string;
  total_score: number;
  user_email?: string;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, total_score')
          .order('total_score', { ascending: false })
          .limit(10);

        if (profilesError) throw profilesError;

        // Since we can't access auth.users directly, we'll just use anonymous usernames
        const leaderboardWithEmails = profiles.map((profile, index) => ({
          ...profile,
          user_email: `Player ${index + 1}`
        }));

        setLeaderboard(leaderboardWithEmails);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
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
        () => {
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
                <span className="font-medium text-slate-900">{entry.user_email}</span>
              </div>
              <span className="font-bold text-lime-600">{entry.total_score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
