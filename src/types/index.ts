export interface UserWithStats {
  id: string
  username: string
  avatar: string | null
  isAdmin: boolean
  totalPoints: number
  rank: number
  picks: PickWithTeam[]
}

export interface PickWithTeam {
  id: string
  teamId: string
  tierId: string
  tierNumber: number
  team: {
    id: string
    name: string
    code: string
    flagEmoji: string
    eliminated: boolean
    finalPosition: string | null
    group: string | null
  }
  pointsEarned: number
}

export interface StandingsEntry {
  rank: number
  userId: string
  username: string
  avatar: string | null
  totalPoints: number
  weekPoints: number
  picks: PickWithTeam[]
}

export interface MatchDisplay {
  id: string
  matchNumber: number
  round: string
  group: string | null
  scheduledAt: string
  venue: string | null
  status: string
  homeTeam: TeamDisplay | null
  awayTeam: TeamDisplay | null
  homeScore: number | null
  awayScore: number | null
  homePenalties: number | null
  awayPenalties: number | null
}

export interface TeamDisplay {
  id: string
  name: string
  code: string
  flagEmoji: string
  group: string | null
  eliminated: boolean
}

export interface TierConfig {
  id: string
  number: number
  label: string
  maxPicks: number
  multiplier: number
  teams: TeamDisplay[]
}

export interface PointsHistoryEntry {
  date: string
  totalPoints: number
  username: string
}
