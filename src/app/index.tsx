import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";

// Object shapes used by the screen and by ESPN API responses.
type Player = {
  id: string;
  name: string;
  position: string;
  jersey: string;
  x: number;
  y: number;
  color: string;
  info: string;
  playstyle?: string;
  imageUrl?: string;
};

type TeamInfo = {
  id?: string;
  name: string;
  abbreviation: string;
  color: string;
  alternateColor: string;
  role: "offense" | "defense";
  players: Player[];
  score?: string;
  logoUrl?: string;
};

type Game = {
  id: string;
  status: string;
  date?: string;
  seasonYear?: number;
  isFinal?: boolean;
  isInProgress?: boolean;
  away: TeamInfo;
  home: TeamInfo;
};

type EspnPlayRecord = {
  id?: string;
  sequenceNumber?: string | number;
  type?: {
    text?: string;
  };
  text?: string;
  shortText?: string;
  period?: {
    number?: number;
  };
  clock?: {
    displayValue?: string;
  };
  teamParticipants?: {
    id?: string;
    type?: string;
  }[];
  participants?: {
    athlete?: {
      $ref?: string;
    };
    type?: string;
  }[];
  start?: {
    down?: number;
    distance?: number;
    yardsToEndzone?: number;
    possessionText?: string;
  };
  end?: {
    down?: number;
    distance?: number;
    yardsToEndzone?: number;
    possessionText?: string;
  };
  statYardage?: number;
  isPenalty?: boolean;
};

type GamePlay = {
  id: string;
  sequenceNumber: number;
  type: string;
  text: string;
  shortText?: string;
  period: number;
  clock: string;
  offenseTeamId: string;
  defenseTeamId: string;
  start?: EspnPlayRecord["start"];
  end?: EspnPlayRecord["end"];
  statYardage?: number;
  isPenalty: boolean;
  participants: {
    athleteId: string;
    role: string;
  }[];
};

type PlayParticipant = {
  id: string;
  name: string;
  position: string;
  jersey: string;
  teamId: string;
  role: string;
  color: string;
  player: Player;
};

type RosterAthlete = {
  id?: string;
  displayName?: string;
  fullName?: string;
  jersey?: string | number;
  position?: {
    abbreviation?: string;
  };
  headshot?: {
    href?: string;
  };
  status?: {
    type?: {
      name?: string;
      description?: string;
      id?: string;
    };
    name?: string;
  };
  active?: boolean;
  injured?: boolean;
  injuryStatus?: string;
};

type TeamScheduleEvent = {
  id?: string;
  date?: string;
  competitions?: {
    status?: {
      type?: {
        completed?: boolean;
      };
    };
    competitors?: {
      team?: {
        id?: string;
      };
    }[];
  }[];
};

type GameRosterEntry = {
  playerId?: string | number;
  starter?: boolean;
  valid?: boolean;
  didNotPlay?: boolean;
};

type GameInjuryReport = {
  injuries?: {
    status?: string;
    athlete?: {
      id?: string;
    };
  }[];
};

type FormationRole =
  | "offensiveLine"
  | "quarterback"
  | "runningBack"
  | "tightEnd"
  | "receiver"
  | "defensiveLine"
  | "linebacker"
  | "defensiveBack";

type FormationSpot = {
  role: FormationRole;
  x: number;
  y: number;
};

type GameFormationPlan = {
  awayTeamId: string;
  homeTeamId: string;
  awayRole: "offense" | "defense";
  homeRole: "offense" | "defense";
  awayPlayerIds: string[];
  homePlayerIds: string[];
  awaySpots: FormationSpot[];
  homeSpots: FormationSpot[];
};

// Screen dimensions and sample data used when live game data is unavailable.
const FIELD_WIDTH = 1200;
const FIELD_HEIGHT = 600;
const SCREEN_WIDTH = Dimensions.get("screen").width;
const SCREEN_HEIGHT = Dimensions.get("screen").height;
const EXPANDED_WINDOW_WIDTH = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);
const EXPANDED_WINDOW_HEIGHT = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);

const demoGames: Game[] = [
  {
    id: "demo-1",
    status: "Live • Q2 • 03:14",
    away: {
      name: "Buffalo Bills",
      abbreviation: "BUF",
      color: "#0C2340",
      alternateColor: "#C60C30",
      role: "offense",
      players: [
        {
          id: "buf-1",
          name: "Josh Allen",
          position: "QB",
          jersey: "17",
          x: 220,
          y: 200,
          color: "#00338D",
          info: "Pro Bowl quarterback with mobility and downfield arm talent.",
        },
        {
          id: "buf-2",
          name: "Stefon Diggs",
          position: "WR",
          jersey: "14",
          x: 440,
          y: 220,
          color: "#00338D",
          info: "Elite route runner with high-volume receiving production.",
        },
        {
          id: "buf-3",
          name: "James Cook",
          position: "RB",
          jersey: "4",
          x: 350,
          y: 145,
          color: "#00338D",
          info: "Explosive runner who also contributes in the passing game.",
        },
        {
          id: "buf-4",
          name: "Tremaine Edmunds",
          position: "LB",
          jersey: "49",
          x: 610,
          y: 430,
          color: "#00338D",
          info: "Versatile linebacker with downhill playmaking instincts.",
        },
      ],
    },
    home: {
      name: "Kansas City Chiefs",
      abbreviation: "KC",
      color: "#E31837",
      alternateColor: "#FFB81C",
      role: "defense",
      players: [
        {
          id: "kc-1",
          name: "Patrick Mahomes",
          position: "QB",
          jersey: "15",
          x: 220,
          y: 380,
          color: "#E31837",
          info: "Dynamic passer with elite improvisation and deep-ball range.",
        },
        {
          id: "kc-2",
          name: "Travis Kelce",
          position: "TE",
          jersey: "87",
          x: 460,
          y: 340,
          color: "#E31837",
          info: "High-impact tight end known for contested catches and playmaking \n Taylor Swift's husband.",
        },
        {
          id: "kc-3",
          name: "Isiah Pacheco",
          position: "RB",
          jersey: "10",
          x: 350,
          y: 470,
          color: "#E31837",
          info: "Power back who creates yards after contact.",
        },
        {
          id: "kc-4",
          name: "Nick Bolton",
          position: "LB",
          jersey: "32",
          x: 610,
          y: 170,
          color: "#E31837",
          info: "Fast, downhill linebacker with strong tackling range.",
        },
      ],
    },
  },
  {
    id: "demo-2",
    status: "Scheduled • 8:15 PM",
    away: {
      name: "Dallas Cowboys",
      abbreviation: "DAL",
      color: "#003594",
      alternateColor: "#869397",
      role: "offense",
      players: [
        {
          id: "dal-1",
          name: "Dak Prescott",
          position: "QB",
          jersey: "4",
          x: 250,
          y: 240,
          color: "#003594",
          info: "Accurate passer with quick processing and timing rhythm.",
        },
        {
          id: "dal-2",
          name: "CeeDee Lamb",
          position: "WR",
          jersey: "88",
          x: 520,
          y: 210,
          color: "#003594",
          info: "Shifty vertical threat and a consistent target earner.",
        },
      ],
    },
    home: {
      name: "Philadelphia Eagles",
      abbreviation: "PHI",
      color: "#004C54",
      alternateColor: "#A5ACAF",
      role: "defense",
      players: [
        {
          id: "phi-1",
          name: "Jalen Hurts",
          position: "QB",
          jersey: "1",
          x: 250,
          y: 360,
          color: "#004C54",
          info: "Dual-threat leader who stresses defenses with both his arm and legs.",
        },
        {
          id: "phi-2",
          name: "A.J. Brown",
          position: "WR",
          jersey: "11",
          x: 540,
          y: 370,
          color: "#004C54",
          info: "Big-play receiver with strong catch radius.",
        },
      ],
    },
  },
];

const rosterCache = new Map<string, Promise<RosterAthlete[]>>();
const teamScheduleCache = new Map<string, Promise<TeamScheduleEvent[]>>();
const gameStarterCache = new Map<string, Promise<string[]>>();
const gameLineupCache = new Map<string, Promise<Game>>();
const formationCache = new Map<string, GameFormationPlan>();

// Field layouts and the positions eligible for each formation role.
const offenseFormations: FormationSpot[][] = [
  [
    ...[170, 235, 300, 365, 430].map((y) => ({
      role: "offensiveLine" as const,
      x: 590,
      y,
    })),
    { role: "quarterback", x: 545, y: 300 },
    { role: "runningBack", x: 525, y: 380 },
    { role: "tightEnd", x: 575, y: 115 },
    { role: "receiver", x: 550, y: 55 },
    { role: "receiver", x: 550, y: 545 },
    { role: "receiver", x: 565, y: 475 },
  ],
  [
    ...[170, 235, 300, 365, 430].map((y) => ({
      role: "offensiveLine" as const,
      x: 590,
      y,
    })),
    { role: "quarterback", x: 545, y: 300 },
    { role: "runningBack", x: 525, y: 380 },
    { role: "tightEnd", x: 575, y: 115 },
    { role: "tightEnd", x: 575, y: 485 },
    { role: "receiver", x: 550, y: 55 },
    { role: "receiver", x: 550, y: 545 },
  ],
];

const defenseFormations: FormationSpot[][] = [
  [
    ...[205, 270, 335, 400].map((y) => ({
      role: "defensiveLine" as const,
      x: 625,
      y,
    })),
    ...[235, 300, 365].map((y) => ({ role: "linebacker" as const, x: 655, y })),
    ...[85, 210, 390, 515].map((y) => ({
      role: "defensiveBack" as const,
      x: 685,
      y,
    })),
  ],
  [
    ...[185, 300, 415].map((y) => ({
      role: "defensiveLine" as const,
      x: 625,
      y,
    })),
    ...[120, 240, 360, 480].map((y) => ({
      role: "linebacker" as const,
      x: 665,
      y,
    })),
    ...[55, 200, 400, 545].map((y) => ({
      role: "defensiveBack" as const,
      x: 710,
      y,
    })),
  ],
];

const rolePositions: Record<FormationRole, string[]> = {
  offensiveLine: ["C", "G", "OG", "LG", "RG", "OT", "T", "LT", "RT", "OL"],
  quarterback: ["QB"],
  runningBack: ["RB", "FB"],
  tightEnd: ["TE"],
  receiver: ["WR"],
  defensiveLine: ["DE", "DT", "NT", "DL", "EDGE"],
  linebacker: ["LB", "OLB", "ILB", "MLB"],
  defensiveBack: ["CB", "S", "FS", "SS", "DB"],
};

// ESPN data loading, previous-game starter lookup, and player availability.
const getTeamRoster = (teamId: string): Promise<RosterAthlete[]> => {
  const cachedRoster = rosterCache.get(teamId);
  if (cachedRoster) {
    return cachedRoster;
  }

  const rosterRequest = fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Roster request failed");
      }

      const data = await response.json();
      const groups = Array.isArray(data?.athletes) ? data.athletes : [];
      const seenPlayerIds = new Set<string>();

      return groups.flatMap((group: any) =>
        (Array.isArray(group?.items) ? group.items : []).filter(
          (athlete: RosterAthlete) => {
            if (!athlete.id || seenPlayerIds.has(athlete.id)) {
              return false;
            }

            seenPlayerIds.add(athlete.id);
            return true;
          },
        ),
      );
    })
    .catch((error: unknown) => {
      rosterCache.delete(teamId);
      console.warn(`Could not load roster for team ${teamId}`, error);
      return [];
    });

  rosterCache.set(teamId, rosterRequest);
  return rosterRequest;
};

const getGamePlays = async (gameId: string): Promise<GamePlay[]> => {
  const response = await fetch(
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}/competitions/${gameId}/plays?limit=500`,
  );
  if (!response.ok) {
    throw new Error("Game play-by-play request failed");
  }

  const data: { items?: EspnPlayRecord[] } = await response.json();
  const administrativePlayTypes = new Set([
    "coin toss",
    "end of game",
    "end of half",
    "end of period",
    "official timeout",
    "timeout",
  ]);

  return (Array.isArray(data.items) ? data.items : [])
    .flatMap((record) => {
      const offenseTeamId = record.teamParticipants?.find((participant) =>
        participant.type?.toLowerCase().includes("offense"),
      )?.id;
      const defenseTeamId = record.teamParticipants?.find((participant) =>
        participant.type?.toLowerCase().includes("defense"),
      )?.id;
      const type = record.type?.text?.trim() ?? "";
      const text = record.text?.trim() ?? record.shortText?.trim() ?? "";

      if (
        !record.id ||
        !type ||
        !text ||
        !offenseTeamId ||
        !defenseTeamId ||
        !record.start ||
        !record.end ||
        administrativePlayTypes.has(type.toLowerCase())
      ) {
        return [];
      }

      const participantIds = new Set<string>();
      const participants = (record.participants ?? [])
        .flatMap((participant) => {
          const athleteId =
            participant.athlete?.$ref?.match(/\/athletes\/(\d+)/)?.[1];
          return athleteId
            ? [{ athleteId, role: participant.type ?? "participant" }]
            : [];
        })
        .filter((participant) => {
          if (participantIds.has(participant.athleteId)) {
            return false;
          }
          participantIds.add(participant.athleteId);
          return true;
        });

      return [
        {
          id: record.id,
          sequenceNumber: Number(record.sequenceNumber) || 0,
          type,
          text,
          shortText: record.shortText,
          period: record.period?.number ?? 0,
          clock: record.clock?.displayValue ?? "",
          offenseTeamId,
          defenseTeamId,
          start: record.start,
          end: record.end,
          statYardage: record.statYardage,
          isPenalty: record.isPenalty === true,
          participants,
        },
      ];
    })
    .sort((first, second) => first.sequenceNumber - second.sequenceNumber);
};

const getFieldXFromYardsToEndzone = (
  yardsToEndzone: number | undefined,
  offenseAttacksRight: boolean,
): number | undefined => {
  if (
    yardsToEndzone === undefined ||
    !Number.isFinite(yardsToEndzone) ||
    yardsToEndzone < 0 ||
    yardsToEndzone > 100
  ) {
    return undefined;
  }

  return offenseAttacksRight
    ? FIELD_WIDTH - 100 - yardsToEndzone * 10
    : 100 + yardsToEndzone * 10;
};

const getSchematicPlayerPosition = (
  team: TeamInfo,
  player: Player,
  offense: boolean,
  lineOfScrimmageX: number,
  direction: number,
): { x: number; y: number } => {
  const position = player.position.toUpperCase();
  const linePositions = offense
    ? ["OL", "C", "G", "OG", "LG", "RG", "OT", "T", "LT", "RT"]
    : ["DE", "DT", "NT", "DL", "EDGE"];
  const playersAtPosition = team.players.filter((candidate) =>
    linePositions.includes(candidate.position.toUpperCase()),
  );
  const groupIndex = Math.max(
    0,
    playersAtPosition.findIndex((candidate) => candidate.id === player.id),
  );

  if (offense) {
    if (linePositions.includes(position)) {
      return {
        x: lineOfScrimmageX - direction * 12,
        y: 180 + groupIndex * 60,
      };
    }
    if (position === "QB") {
      return { x: lineOfScrimmageX - direction * 82, y: 300 };
    }
    if (["RB", "FB"].includes(position)) {
      const runningBacks = team.players.filter((candidate) =>
        ["RB", "FB"].includes(candidate.position.toUpperCase()),
      );
      const runningBackIndex = Math.max(
        0,
        runningBacks.findIndex((candidate) => candidate.id === player.id),
      );
      return {
        x: lineOfScrimmageX - direction * 105,
        y: 420 + runningBackIndex * 55,
      };
    }
    if (position === "TE") {
      const tightEnds = team.players.filter(
        (candidate) => candidate.position.toUpperCase() === "TE",
      );
      const tightEndIndex = Math.max(
        0,
        tightEnds.findIndex((candidate) => candidate.id === player.id),
      );
      return {
        x: lineOfScrimmageX - direction * 65,
        y: tightEndIndex === 0 ? 150 : 450,
      };
    }

    if (position === "WR") {
      const receivers = team.players.filter(
        (candidate) => candidate.position.toUpperCase() === "WR",
      );
      const receiverIndex = Math.max(
        0,
        receivers.findIndex((candidate) => candidate.id === player.id),
      );
      const receiverY = [55, 545, 110, 490][receiverIndex % 4];
      return { x: lineOfScrimmageX - direction * 8, y: receiverY };
    }

    const offensiveSkillPlayers = team.players.filter((candidate) => {
      const candidatePosition = candidate.position.toUpperCase();
      return (
        !linePositions.includes(candidatePosition) &&
        !["QB", "RB", "FB", "TE", "WR"].includes(candidatePosition)
      );
    });
    const skillIndex = Math.max(
      0,
      offensiveSkillPlayers.findIndex(
        (candidate) => candidate.id === player.id,
      ),
    );
    return {
      x: lineOfScrimmageX - direction * 190,
      y: [160, 300, 440][skillIndex % 3],
    };
  }

  if (["DE", "DT", "NT", "DL", "EDGE"].includes(position)) {
    return { x: lineOfScrimmageX + direction * 42, y: 175 + groupIndex * 80 };
  }
  if (["LB", "OLB", "ILB", "MLB"].includes(position)) {
    const linebackers = team.players.filter((candidate) =>
      ["LB", "OLB", "ILB", "MLB"].includes(candidate.position.toUpperCase()),
    );
    const linebackerIndex = Math.max(
      0,
      linebackers.findIndex((candidate) => candidate.id === player.id),
    );
    return {
      x: lineOfScrimmageX + direction * 135,
      y: [110, 235, 365, 490][linebackerIndex % 4],
    };
  }

  const defensiveBackPositions = ["CB", "S", "FS", "SS", "DB"];
  if (defensiveBackPositions.includes(position)) {
    const defensiveBacks = team.players.filter((candidate) =>
      defensiveBackPositions.includes(candidate.position.toUpperCase()),
    );
    const defensiveBackIndex = Math.max(
      0,
      defensiveBacks.findIndex((candidate) => candidate.id === player.id),
    );
    return {
      x: lineOfScrimmageX + direction * 245,
      y: [55, 200, 400, 545][defensiveBackIndex % 4],
    };
  }

  const unclassifiedDefenders = team.players.filter((candidate) => {
    const candidatePosition = candidate.position.toUpperCase();
    return (
      !linePositions.includes(candidatePosition) &&
      !["LB", "OLB", "ILB", "MLB"].includes(candidatePosition) &&
      !defensiveBackPositions.includes(candidatePosition)
    );
  });
  const unclassifiedIndex = Math.max(
    0,
    unclassifiedDefenders.findIndex((candidate) => candidate.id === player.id),
  );
  return {
    x: lineOfScrimmageX + direction * 310,
    y: [150, 300, 450][unclassifiedIndex % 3],
  };
};

const getTeamSchedule = (
  teamId: string,
  seasonYear: number,
): Promise<TeamScheduleEvent[]> => {
  const cacheKey = `${teamId}:${seasonYear}`;
  const cachedSchedule = teamScheduleCache.get(cacheKey);
  if (cachedSchedule) {
    return cachedSchedule;
  }

  const scheduleRequest = fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule?season=${seasonYear}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Team schedule request failed");
      }

      const data: { events?: TeamScheduleEvent[] } = await response.json();
      return Array.isArray(data.events) ? data.events : [];
    })
    .catch((error: unknown) => {
      teamScheduleCache.delete(cacheKey);
      console.warn(`Could not load the schedule for team ${teamId}`, error);
      return [];
    });

  teamScheduleCache.set(cacheKey, scheduleRequest);
  return scheduleRequest;
};

const getPreviousGameStarterIds = async (
  teamId: string,
  seasonYear: number,
  gameDate: string,
): Promise<string[]> => {
  const gameTimestamp = Date.parse(gameDate);
  if (!Number.isFinite(gameTimestamp)) {
    return [];
  }

  const schedule = await getTeamSchedule(teamId, seasonYear);
  const previousGame = schedule
    .filter((event) => {
      const eventDate = Date.parse(event.date ?? "");
      return (
        Boolean(event.id) &&
        Number.isFinite(eventDate) &&
        eventDate < gameTimestamp &&
        event.competitions?.some(
          (competition) =>
            competition.status?.type?.completed === true &&
            competition.competitors?.some(
              (competitor) => competitor.team?.id === teamId,
            ),
        )
      );
    })
    .sort(
      (first, second) =>
        Date.parse(second.date ?? "") - Date.parse(first.date ?? ""),
    )[0];

  if (!previousGame?.id) {
    return [];
  }

  const cacheKey = `${previousGame.id}:${teamId}`;
  const cachedStarters = gameStarterCache.get(cacheKey);
  if (cachedStarters) {
    return cachedStarters;
  }

  const starterRequest = fetch(
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${previousGame.id}/competitions/${previousGame.id}/competitors/${teamId}/roster?limit=100`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Previous-game roster request failed");
      }

      const data: { entries?: GameRosterEntry[] } = await response.json();
      return (Array.isArray(data.entries) ? data.entries : []).flatMap(
        (entry) =>
          entry.starter === true &&
          entry.valid !== false &&
          entry.didNotPlay !== true &&
          entry.playerId !== undefined
            ? [String(entry.playerId)]
            : [],
      );
    })
    .catch((error: unknown) => {
      gameStarterCache.delete(cacheKey);
      console.warn(
        `Could not load starters from team ${teamId}'s previous game`,
        error,
      );
      return [];
    });

  gameStarterCache.set(cacheKey, starterRequest);
  return starterRequest;
};

const inactiveStatusTerms = [
  "inactive",
  "out",
  "injured reserve",
  "suspended",
  "doubtful",
  "questionable",
  "unlikely",
  "not active",
  "unavailable",
  "physically unable to perform",
  "non-football injury",
  "pup",
  "nfi",
  "n/a",
];

const isStatusUnavailable = (statusText: string): boolean => {
  const normalizedStatus = statusText.toLowerCase();
  return (
    normalizedStatus.includes("injured") ||
    inactiveStatusTerms.some((term) =>
      new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
        normalizedStatus,
      ),
    )
  );
};

const getAthletePosition = (athlete: RosterAthlete): string =>
  athlete.position?.abbreviation ?? "ATH";

const isAthleteLikelyAvailable = (athlete: RosterAthlete): boolean => {
  const statusText = [
    athlete.status?.type?.name,
    athlete.status?.type?.description,
    athlete.status?.name,
    athlete.injuryStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (athlete.active === false) {
    return false;
  }

  if (athlete.injured || isStatusUnavailable(statusText)) {
    return false;
  }

  return true;
};

const getGameUnavailablePlayerIds = (gameId: string): Promise<Set<string>> => {
  return fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Game injury report request failed");
      }

      const data: { injuries?: GameInjuryReport[] } = await response.json();
      const unavailablePlayerIds = new Set<string>();

      for (const teamReport of Array.isArray(data.injuries)
        ? data.injuries
        : []) {
        for (const injury of teamReport.injuries ?? []) {
          const playerId = injury.athlete?.id;
          if (playerId && isStatusUnavailable(injury.status ?? "")) {
            unavailablePlayerIds.add(playerId);
          }
        }
      }

      return unavailablePlayerIds;
    })
    .catch((error: unknown) => {
      console.warn(`Could not load injury statuses for game ${gameId}`, error);
      return new Set<string>();
    });
};

const getStarterPriority = (position: string): number => {
  const value = position.toUpperCase();

  if (value === "QB") return 120;
  if (["LT", "LG", "C", "RG", "RT", "OT", "G", "T", "OL"].includes(value))
    return 110;
  if (["RB", "FB"].includes(value)) return 100;
  if (["TE"].includes(value)) return 95;
  if (["WR"].includes(value)) return 90;
  if (["DE", "DT", "NT", "EDGE", "DL"].includes(value)) return 105;
  if (["LB", "OLB", "ILB", "MLB"].includes(value)) return 100;
  if (["CB", "S", "FS", "SS", "DB"].includes(value)) return 95;

  return 50;
};

const getRosterHierarchyIndex = (
  athlete: RosterAthlete,
  roster: RosterAthlete[],
): number => {
  const index = roster.findIndex((candidate) => candidate.id === athlete.id);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
};

// Build a lineup from available prior starters, filling gaps from the roster.
const selectFormationPlayers = (
  athletes: RosterAthlete[],
  spots: FormationSpot[],
  previousStarterIds: ReadonlySet<string>,
  unavailablePlayerIds: ReadonlySet<string>,
  preferredPlayerIds: ReadonlySet<string> = new Set(),
  trackedQuarterbackIds: ReadonlySet<string> = new Set(),
): string[] => {
  const available = athletes.filter(
    (athlete): athlete is RosterAthlete & { id: string } => {
      return (
        athlete.id !== undefined &&
        !unavailablePlayerIds.has(athlete.id) &&
        isAthleteLikelyAvailable(athlete)
      );
    },
  );

  const remaining = [...available].sort((a, b) => {
    const trackedQuarterbackPriority =
      Number(trackedQuarterbackIds.has(b.id)) -
      Number(trackedQuarterbackIds.has(a.id));
    if (trackedQuarterbackPriority !== 0) {
      return trackedQuarterbackPriority;
    }

    const preferredPriority =
      Number(preferredPlayerIds.has(b.id)) -
      Number(preferredPlayerIds.has(a.id));
    if (preferredPriority !== 0) {
      return preferredPriority;
    }

    const starterPriority =
      Number(previousStarterIds.has(b.id)) -
      Number(previousStarterIds.has(a.id));
    if (starterPriority !== 0) {
      return starterPriority;
    }

    const rosterIndexDiff =
      getRosterHierarchyIndex(a, athletes) -
      getRosterHierarchyIndex(b, athletes);

    if (rosterIndexDiff !== 0) {
      return rosterIndexDiff;
    }

    const priorityDiff =
      getStarterPriority(getAthletePosition(b)) -
      getStarterPriority(getAthletePosition(a));

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return (a.displayName ?? a.fullName ?? "").localeCompare(
      b.displayName ?? b.fullName ?? "",
    );
  });

  const selectedIds: string[] = [];

  for (const spot of spots) {
    const eligiblePositions = rolePositions[spot.role];
    const candidate = remaining.find((athlete) =>
      eligiblePositions.includes(getAthletePosition(athlete)),
    );
    const fallback = remaining.find(
      (athlete) => athlete.position?.abbreviation !== undefined,
    );
    const chosen = candidate ?? fallback;

    if (!chosen) {
      continue;
    }

    const index = remaining.indexOf(chosen);
    remaining.splice(index, 1);
    selectedIds.push(chosen.id as string);
  }

  return selectedIds;
};

const getFormationPlan = (
  gameId: string,
  awayTeamId: string,
  homeTeamId: string,
  awayRoster: RosterAthlete[],
  homeRoster: RosterAthlete[],
  awayStarterIds: ReadonlySet<string>,
  homeStarterIds: ReadonlySet<string>,
  unavailablePlayerIds: ReadonlySet<string>,
): GameFormationPlan => {
  const cachedPlan = formationCache.get(gameId);
  const cachedFormation =
    cachedPlan &&
    cachedPlan.awayTeamId === awayTeamId &&
    cachedPlan.homeTeamId === homeTeamId &&
    cachedPlan.awaySpots.length > 0 &&
    cachedPlan.homeSpots.length > 0
      ? cachedPlan
      : undefined;

  const awayIsOffense = true;
  const offenseSpots = cachedFormation
    ? cachedFormation.awayRole === "offense"
      ? cachedFormation.awaySpots
      : cachedFormation.homeSpots
    : offenseFormations[Math.floor(Math.random() * offenseFormations.length)];
  const defenseSpots = cachedFormation
    ? cachedFormation.awayRole === "defense"
      ? cachedFormation.awaySpots
      : cachedFormation.homeSpots
    : defenseFormations[Math.floor(Math.random() * defenseFormations.length)];
  const awaySpots = awayIsOffense ? offenseSpots : defenseSpots;
  const homeSpots = awayIsOffense ? defenseSpots : offenseSpots;
  const orientSpots = (spots: FormationSpot[]): FormationSpot[] =>
    awayIsOffense
      ? spots
      : spots.map((spot) => ({ ...spot, x: FIELD_WIDTH - spot.x }));
  const plan: GameFormationPlan = {
    awayTeamId,
    homeTeamId,
    awayRole: awayIsOffense ? "offense" : "defense",
    homeRole: awayIsOffense ? "defense" : "offense",
    awayPlayerIds: selectFormationPlayers(
      awayRoster,
      awaySpots,
      awayStarterIds,
      unavailablePlayerIds,
    ),
    homePlayerIds: selectFormationPlayers(
      homeRoster,
      homeSpots,
      homeStarterIds,
      unavailablePlayerIds,
    ),
    awaySpots: orientSpots(awaySpots),
    homeSpots: orientSpots(homeSpots),
  };

  formationCache.set(gameId, plan);
  return plan;
};

const placeFormationPlayers = (
  athletes: RosterAthlete[],
  playerIds: string[],
  spots: FormationSpot[],
  team: TeamInfo,
): Player[] => {
  const rosterById = new Map(athletes.map((athlete) => [athlete.id, athlete]));

  return playerIds.flatMap((id, index) => {
    const athlete = rosterById.get(id);
    const spot = spots[index];
    if (!athlete || !spot) {
      return [];
    }

    const position = athlete.position?.abbreviation ?? "ATH";
    const imageUrl =
      athlete.headshot?.href ??
      (id
        ? `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`
        : undefined);
    const profileName =
      athlete.displayName ?? athlete.fullName ?? "Unknown player";
    const summary = `${profileName} is a ${position} who contributes with a balanced mix of effort and football IQ.`;

    return [
      {
        id: `${team.abbreviation}-${id}`,
        name: profileName,
        position,
        jersey: String(athlete.jersey ?? "00"),
        x: spot.x,
        y: spot.y,
        color: team.color,
        info: `${position} for the ${team.name}.`,
        playstyle: getPlayerPlaystyleSummary({
          id: `${team.abbreviation}-${id}`,
          name: profileName,
          position,
          jersey: String(athlete.jersey ?? "00"),
          x: spot.x,
          y: spot.y,
          color: team.color,
          info: summary,
        }),
        imageUrl,
      },
    ];
  });
};

// Player descriptions and grouping helpers used by the lineup UI.
const getPlayerPlaystyleSummary = (player: Player): string => {
  const baseInfo = player.info?.trim();
  const cleanName = player.name.split(" ")[0] ?? player.name;
  const position = player.position?.trim() ?? "ATH";

  if (position === "QB") {
    return `${baseInfo || `${cleanName} is a quarterbacks-first decision maker who manipulates the pocket and keeps the offense on schedule.`} He sees the field early, keeps plays alive with movement, and makes the right throw when a lane opens. His game is built on timing, anticipation, and the ability to turn broken plays into positive gains.`;
  }

  if (["RB", "FB"].includes(position)) {
    return `${baseInfo || `${cleanName} is a downhill runner who creates value through vision, balance, and contact balance.`} He attacks space with patience before accelerating through lanes and finishing with toughness. His playstyle is built on physical running, pass-catching versatility, and steady production in key moments.`;
  }

  if (["WR", "TE"].includes(position)) {
    return `${baseInfo || `${cleanName} is a big-play athlete who wins with route discipline and ball skills.`} He creates separation, controls leverage, and attacks the ball with confidence in contested situations. His game emphasizes reliable hands, timing, and the ability to turn short routes into explosive gains.`;
  }

  if (["DE", "DT", "NT", "DL", "EDGE"].includes(position)) {
    return `${baseInfo || `${cleanName} is a disruptive front-seven presence who creates pressure and collapses the pocket.`} He wins with power, leverage, and quick hands while attacking the quarterback or the ball carrier. His playstyle is defined by disruption, effort, and the ability to alter the rhythm of a drive.`;
  }

  if (["LB", "OLB", "ILB", "MLB"].includes(position)) {
    return `${baseInfo || `${cleanName} is a fast, physical linebacker who reads the play and closes space quickly.`} He plays with good instincts, tackling power, and the awareness to defend both the run and the pass. His game balances downhill aggression with the patience to diagnose where the ball is going.`;
  }

  if (["CB", "S", "FS", "SS", "DB"].includes(position)) {
    return `${baseInfo || `${cleanName} is a coverage-minded defender who stays connected to the ball and the receiver.`} He competes through leverage, anticipation, and quick reactions to break up throws or take away routes. His style is centered on discipline, speed, and creating tough coverage situations for the offense.`;
  }

  if (
    ["C", "G", "OG", "LG", "RG", "OT", "T", "LT", "RT", "OL"].includes(position)
  ) {
    return `${baseInfo || `${cleanName} is an interior or edge protector who stabilizes the blocking front.`} He controls leverage, wins first contact, and gives the quarterback time to operate. His game is rooted in technique, balance, and making the next block before the defense can reset.`;
  }

  return `${baseInfo || `${cleanName} is a versatile player who adapts to the flow of the game.`} He consistently looks to win his matchup, maintain discipline, and make smart decisions when the play develops. His overall style is defined by toughness, awareness, and the ability to contribute in multiple situations.`;
};

const getPlayerGroup = (position: string): string => {
  if (
    ["C", "G", "OG", "LG", "RG", "OT", "T", "LT", "RT", "OL"].includes(position)
  ) {
    return "Offensive line";
  }

  if (position === "QB") return "Quarterbacks";
  if (["RB", "FB"].includes(position)) return "Running backs";
  if (position === "TE") return "Tight ends";
  if (position === "WR") return "Wide receivers";
  if (["DE", "DT", "NT", "DL", "EDGE"].includes(position)) {
    return "Defensive line";
  }
  if (["LB", "OLB", "ILB", "MLB"].includes(position)) return "Linebackers";
  if (["CB", "S", "FS", "SS", "DB"].includes(position)) {
    return "Defensive backs";
  }

  return "Other";
};

const getPlayerGroups = (players: Player[]) => {
  const grouped = new Map<string, Player[]>();
  const groupOrder = [
    "Quarterbacks",
    "Offensive line",
    "Running backs",
    "Tight ends",
    "Wide receivers",
    "Defensive line",
    "Linebackers",
    "Defensive backs",
    "Other",
  ];

  players.forEach((player) => {
    const group = getPlayerGroup(player.position);
    const groupPlayers = grouped.get(group) ?? [];
    groupPlayers.push(player);
    grouped.set(group, groupPlayers);
  });

  return groupOrder.flatMap((title) => {
    const groupPlayers = grouped.get(title);
    return groupPlayers ? [{ title, players: groupPlayers }] : [];
  });
};

// Text shown in the informational modal for each position group.
const positionGroupInfo: Record<
  string,
  { objective: string; roles: { name: string; description: string }[] }
> = {
  Quarterbacks: {
    objective: "Lead the offense, read the defense, and distribute the ball.",
    roles: [
      {
        name: "QB | Quarterback",
        description:
          "Receives the snap and directs the play as a passer or runner.",
      },
    ],
  },
  "Offensive line": {
    objective: "Protect the quarterback and open running lanes.",
    roles: [
      {
        name: "C | Center",
        description: "Snaps the ball and calls blocking adjustments.",
      },
      {
        name: "G | Guard, OG | Offensive Guard, LG | Left Guard, RG | Right Guard",
        description: "Guards the center and blocks interior defenders.",
      },
      {
        name: "T | Tackle, OT | Offensive Tackle, LT | Left Tackle, RT | Right Tackle",
        description: "Lines up outside the guards and protects the edge.",
      },
      {
        name: "OL | Offensive Lineman",
        description: "Generic abbreviation for a player on the offensive line.",
      },
    ],
  },
  "Running backs": {
    objective: "Advance the ball on runs and support the passing game.",
    roles: [
      {
        name: "RB | Running Back",
        description: "Carries the ball, blocks, and can catch passes.",
      },
      {
        name: "FB | Fullback",
        description:
          "Often leads blocks for the runner and may carry or catch the ball.",
      },
    ],
  },
  "Tight ends": {
    objective: "Provide a flexible option as both blocker and receiver.",
    roles: [
      {
        name: "TE | Tight End",
        description: "Blocks on the line or releases to catch passes.",
      },
    ],
  },
  "Wide receivers": {
    objective: "Create separation downfield and catch passes.",
    roles: [
      {
        name: "WR | Wide Receiver",
        description: "Runs routes to get open and make catches.",
      },
    ],
  },
  "Defensive line": {
    objective:
      "Pressure the quarterback and disrupt runs near the line of scrimmage.",
    roles: [
      {
        name: "DE | Defensive End, EDGE | Edge Rusher",
        description: "Rushes from the outside and contains plays at the edge.",
      },
      {
        name: "DT | Defensive Tackle",
        description:
          "Attacks gaps and disrupts the interior of the offensive line.",
      },
      {
        name: "NT | Nose Tackle",
        description:
          "Occupies blockers and anchors the middle of the defensive front.",
      },
      {
        name: "DL | Defensive Lineman",
        description: "Generic designation for a defensive lineman.",
      },
    ],
  },
  Linebackers: {
    objective: "Defend runs, cover short passes, and pressure the quarterback.",
    roles: [
      {
        name: "ILB | Inside Linebacker, MLB | Middle Linebacker",
        description: "Plays inside, reads the offense, and helps stop runs.",
      },
      {
        name: "OLB | Outside Linebacker",
        description: "Plays outside and may rush, cover, or set the edge.",
      },
      {
        name: "LB | Linebacker",
        description: "General linebacker designation.",
      },
    ],
  },
  "Defensive backs": {
    objective: "Cover receivers and prevent completed passes in the secondary.",
    roles: [
      {
        name: "CB | Cornerback",
        description: "Typically covers wide receivers near the sidelines.",
      },
      {
        name: "S | Safety, FS | Free Safety, SS | Strong Safety",
        description: "Provides deeper coverage and supports run defense.",
      },
      {
        name: "DB | Defensive Back",
        description:
          "Generic designation for a player in the defensive secondary.",
      },
    ],
  },
  Other: {
    objective:
      "These positions do not fit the main offensive or defensive groups shown.",
    roles: [
      {
        name: "K / PK | Kicker, P | Punter, LS | Long Snapper, ATH | Athlete",
        description:
          "The player retains the position abbreviation supplied by the roster.",
      },
    ],
  },
};

const uniqueGamesById = (games: Game[]): Game[] => {
  const seenIds = new Set<string>();
  return games.filter((game) => {
    if (seenIds.has(game.id)) {
      return false;
    }

    seenIds.add(game.id);
    return true;
  });
};

const getScoreboardGames = async (): Promise<Game[]> => {
  const response = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  );
  if (!response.ok) {
    throw new Error("NFL scoreboard request failed");
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  const seasonYear = Number(data?.season?.year) || new Date().getFullYear();

  return uniqueGamesById(events.flatMap((event: any) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const homeCompetitor =
      competitors.find((item: any) => item.homeAway === "home") ??
      competitors[0];
    const awayCompetitor =
      competitors.find((item: any) => item.homeAway === "away") ??
      competitors[1] ??
      competitors[0];
    const homeTeam = homeCompetitor?.team;
    const awayTeam = awayCompetitor?.team;
    if (!event.id || !homeTeam || !awayTeam) {
      return [];
    }

    const isFinal = competition?.status?.type?.completed === true;
    const formatScore = (
      score: string | number | { displayValue?: string; value?: number },
    ): string | undefined => {
      if (typeof score === "string" || typeof score === "number") {
        return String(score);
      }

      return score.displayValue ?? score.value?.toString();
    };
    const formatTeam = (
      team: any,
      fallback: TeamInfo,
      role: "offense" | "defense",
      score:
        | string
        | number
        | { displayValue?: string; value?: number }
        | undefined,
    ): TeamInfo => ({
      id: team?.id ? String(team.id) : undefined,
      name: team?.displayName ?? fallback.name,
      abbreviation: team?.abbreviation ?? fallback.abbreviation,
      color: team?.color ? `#${team.color}` : fallback.color,
      alternateColor: team?.alternateColor
        ? `#${team.alternateColor}`
        : fallback.alternateColor,
      role,
      players: [],
      score: score === undefined ? undefined : formatScore(score),
      logoUrl: team?.logo,
    });

    return [
      {
        id: String(event.id),
        status:
          event.status?.type?.detail ??
          event.status?.type?.description ??
          "Scheduled",
        date: String(event.date ?? ""),
        seasonYear,
        isFinal,
        isInProgress: competition?.status?.type?.state === "in",
        away: formatTeam(
          awayTeam,
          demoGames[0].away,
          "offense",
          awayCompetitor?.score,
        ),
        home: formatTeam(
          homeTeam,
          demoGames[0].home,
          "defense",
          homeCompetitor?.score,
        ),
      },
    ];
  }));
};

const getInitialAvailableGames = (scoreboardGames: Game[]): Game[] => {
  const uniqueScoreboardGames = uniqueGamesById(scoreboardGames);
  if (uniqueScoreboardGames.length === 0) {
    return demoGames;
  }

  const availableGames = uniqueScoreboardGames.slice(0, 7);
  const baltimoreGame = uniqueScoreboardGames.find(
    (game) => game.away.id === "33" || game.home.id === "33",
  );
  const pittsburghGameIndex = availableGames.findIndex(
    (game) => game.away.id === "23" || game.home.id === "23",
  );
  const alreadyIncludesBaltimore = availableGames.some(
    (game) => game.id === baltimoreGame?.id,
  );

  if (
    baltimoreGame &&
    !alreadyIncludesBaltimore &&
    pittsburghGameIndex !== -1
  ) {
    availableGames[pittsburghGameIndex] = baltimoreGame;
  }

  const availableIds = new Set(availableGames.map((game) => game.id));
  return uniqueGamesById([
    ...availableGames,
    ...uniqueScoreboardGames.filter(
      (game) => game.isInProgress && !availableIds.has(game.id),
    ),
  ]);
};

const mergeAvailableGames = (
  currentGames: Game[],
  scoreboardGames: Game[],
): Game[] => {
  if (currentGames.every((game) => game.id.startsWith("demo-"))) {
    return getInitialAvailableGames(scoreboardGames);
  }

  const uniqueScoreboardGames = uniqueGamesById(scoreboardGames);
  const gamesById = new Map(
    uniqueScoreboardGames.map((game) => [game.id, game]),
  );
  const availableGames = uniqueGamesById(currentGames)
    .filter((game) => !game.id.startsWith("demo-"))
    .map((currentGame) => {
      const updatedGame = gamesById.get(currentGame.id);
      if (!updatedGame) {
        return currentGame;
      }

      return {
        ...updatedGame,
        away: {
          ...updatedGame.away,
          role: currentGame.away.role,
          players: currentGame.away.players,
        },
        home: {
          ...updatedGame.home,
          role: currentGame.home.role,
          players: currentGame.home.players,
        },
      };
    });
  const availableIds = new Set(availableGames.map((game) => game.id));

  return uniqueGamesById([
    ...availableGames,
    ...uniqueScoreboardGames.filter(
      (game) => game.isInProgress && !availableIds.has(game.id),
    ),
  ]);
};

const getGameLineup = (game: Game): Promise<Game> => {
  const cachedLineup = gameLineupCache.get(game.id);
  if (cachedLineup) {
    return cachedLineup;
  }

  const awayTeamId = game.away.id ?? "";
  const homeTeamId = game.home.id ?? "";
  const seasonYear = game.seasonYear ?? new Date().getFullYear();
  const lineupRequest = (async () => {
    const [awayRoster, homeRoster] = await Promise.all([
      awayTeamId ? getTeamRoster(awayTeamId) : Promise.resolve([]),
      homeTeamId ? getTeamRoster(homeTeamId) : Promise.resolve([]),
    ]);
    const [awayStarterIds, homeStarterIds, unavailablePlayerIds] =
      await Promise.all([
        awayTeamId
          ? getPreviousGameStarterIds(awayTeamId, seasonYear, game.date ?? "")
          : Promise.resolve([]),
        homeTeamId
          ? getPreviousGameStarterIds(homeTeamId, seasonYear, game.date ?? "")
          : Promise.resolve([]),
        getGameUnavailablePlayerIds(game.id),
      ]);
    const formationPlan = getFormationPlan(
      game.id,
      awayTeamId,
      homeTeamId,
      awayRoster,
      homeRoster,
      new Set(awayStarterIds),
      new Set(homeStarterIds),
      unavailablePlayerIds,
    );
    const away = { ...game.away, role: formationPlan.awayRole };
    const home = { ...game.home, role: formationPlan.homeRole };

    away.players = placeFormationPlayers(
      awayRoster,
      formationPlan.awayPlayerIds,
      formationPlan.awaySpots,
      away,
    );
    home.players = placeFormationPlayers(
      homeRoster,
      formationPlan.homePlayerIds,
      formationPlan.homeSpots,
      home,
    );

    return { ...game, away, home };
  })().catch((error: unknown) => {
    gameLineupCache.delete(game.id);
    throw error;
  });

  gameLineupCache.set(game.id, lineupRequest);
  return lineupRequest;
};

// Screen state, event handlers, and React Native rendering.
export default function FieldScreen() {
  const [games, setGames] = useState<Game[]>(demoGames);
  const [selectedGameId, setSelectedGameId] = useState<string>(demoGames[0].id);
  const [playData, setPlayData] = useState<{
    gameId: string;
    plays: GamePlay[];
  }>({ gameId: "", plays: [] });
  const [playsLoadedForGameId, setPlaysLoadedForGameId] = useState("");
  const [playCursor, setPlayCursor] = useState({ gameId: "", index: 0 });
  const [isPlayPickerOpen, setIsPlayPickerOpen] = useState(false);
  const [playLoadError, setPlayLoadError] = useState<{
    gameId: string;
    message: string;
  } | null>(null);
  const [playParticipantData, setPlayParticipantData] = useState<{
    playId: string;
    participants: PlayParticipant[];
    error?: boolean;
  } | null>(null);
  const [playBoardLineups, setPlayBoardLineups] = useState<{
    playId: string;
    awayPlayers: Player[];
    homePlayers: Player[];
  } | null>(null);
  const [lineupLoadState, setLineupLoadState] = useState<{
    gameId: string;
    status: "loaded" | "error";
  } | null>(null);
  const [lineupRetryKey, setLineupRetryKey] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<string | null>(
    null,
  );
  const [isFieldExpanded, setIsFieldExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let isLoading = false;

    const loadGames = async () => {
      if (isLoading) {
        return;
      }

      isLoading = true;
      try {
        const scoreboardGames = await getScoreboardGames();
        if (isMounted) {
          setGames((currentGames) =>
            mergeAvailableGames(currentGames, scoreboardGames),
          );
        }
      } catch (error) {
        console.warn("Could not refresh the NFL scoreboard", error);
      } finally {
        isLoading = false;
      }
    };

    loadGames();
    const interval = setInterval(loadGames, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isFieldExpanded) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setIsFieldExpanded(false);
        return true;
      },
    );

    return () => subscription.remove();
  }, [isFieldExpanded]);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId) ?? games[0],
    [games, selectedGameId],
  );

  useEffect(() => {
    let isMounted = true;

    if (selectedGame.id.startsWith("demo-")) {
      return () => {
        isMounted = false;
      };
    }

    getGameLineup(selectedGame)
      .then((lineup) => {
        if (!isMounted) {
          return;
        }

        setGames((currentGames) =>
          currentGames.map((game) => {
            if (game.id !== lineup.id) {
              return game;
            }

            if (
              game.away.role === lineup.away.role &&
              game.home.role === lineup.home.role &&
              game.away.players === lineup.away.players &&
              game.home.players === lineup.home.players
            ) {
              return game;
            }

            return {
              ...game,
              away: {
                ...game.away,
                role: lineup.away.role,
                players: lineup.away.players,
              },
              home: {
                ...game.home,
                role: lineup.home.role,
                players: lineup.home.players,
              },
            };
          }),
        );
        setLineupLoadState((currentState) =>
          currentState?.gameId === selectedGame.id &&
          currentState.status === "loaded"
            ? currentState
            : { gameId: selectedGame.id, status: "loaded" },
        );
      })
      .catch((error: unknown) => {
        console.warn(
          `Could not load the lineup for game ${selectedGame.id}`,
          error,
        );
        if (isMounted) {
          setLineupLoadState((currentState) =>
            currentState?.gameId === selectedGame.id &&
            currentState.status === "error"
              ? currentState
              : { gameId: selectedGame.id, status: "error" },
          );
        }
      });

    return () => {
      isMounted = false;
    };
    // The selected event ID determines its teams and lineup; scoreboard status refreshes don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame.id, lineupRetryKey]);

  const gamePlays = useMemo(
    () => (playData.gameId === selectedGame.id ? playData.plays : []),
    [playData, selectedGame.id],
  );
  const selectedPlayIndex =
    playCursor.gameId === selectedGame.id ? playCursor.index : 0;
  const selectedPlay = gamePlays[selectedPlayIndex];
  const playParticipants =
    selectedPlay && playParticipantData?.playId === selectedPlay.id
      ? playParticipantData.participants
      : [];
  const playError =
    playLoadError?.gameId === selectedGame.id ? playLoadError.message : null;
  const isLoadingPlays =
    !selectedGame.id.startsWith("demo-") &&
    playsLoadedForGameId !== selectedGame.id &&
    !playError;
  const isLoadingPlayParticipants =
    Boolean(
      selectedPlay &&
      selectedPlay.participants.length > 0 &&
      selectedGame.away.id &&
      selectedGame.home.id,
    ) && playParticipantData?.playId !== selectedPlay?.id;
  const playParticipantError = Boolean(
    selectedPlay &&
    playParticipantData?.playId === selectedPlay.id &&
    playParticipantData.error === true,
  );

  useEffect(() => {
    let isMounted = true;
    let isLoading = false;
    let previousPlays: GamePlay[] = [];
    const isDemoGame = selectedGame.id.startsWith("demo-");

    if (isDemoGame) {
      return () => {
        isMounted = false;
      };
    }

    const loadPlays = async () => {
      if (isLoading) {
        return;
      }

      isLoading = true;
      try {
        const plays = await getGamePlays(selectedGame.id);
        if (!isMounted) {
          return;
        }

        setPlayData({ gameId: selectedGame.id, plays });
        setPlaysLoadedForGameId(selectedGame.id);
        setPlayLoadError(null);
        const priorPlays = previousPlays;
        setPlayCursor((currentCursor) => {
          if (priorPlays.length === 0) {
            return {
              gameId: selectedGame.id,
              index: Math.max(0, plays.length - 1),
            };
          }

          const currentPlay =
            currentCursor.gameId === selectedGame.id
              ? priorPlays[currentCursor.index]
              : priorPlays[priorPlays.length - 1];
          const wasFollowingLatest =
            currentPlay?.id === priorPlays[priorPlays.length - 1]?.id;
          const currentPlayIndex = currentPlay
            ? plays.findIndex((play) => play.id === currentPlay.id)
            : -1;

          return {
            gameId: selectedGame.id,
            index: wasFollowingLatest
              ? Math.max(0, plays.length - 1)
              : currentPlayIndex >= 0
                ? currentPlayIndex
                : Math.min(
                    currentCursor.index,
                    Math.max(0, plays.length - 1),
                  ),
          };
        });
        previousPlays = plays;
      } catch (error) {
        console.warn(
          `Could not load play-by-play for game ${selectedGame.id}`,
          error,
        );
        if (isMounted) {
          setPlaysLoadedForGameId(selectedGame.id);
          setPlayLoadError({
            gameId: selectedGame.id,
            message: "Play-by-play could not be loaded.",
          });
        }
      } finally {
        isLoading = false;
      }
    };

    loadPlays();
    const interval = selectedGame.isInProgress
      ? setInterval(loadPlays, 30000)
      : undefined;

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedGame.id, selectedGame.isInProgress]);

  useEffect(() => {
    let isMounted = true;
    const awayTeamId = selectedGame.away.id;
    const homeTeamId = selectedGame.home.id;

    if (!selectedPlay || !awayTeamId || !homeTeamId) {
      return () => {
        isMounted = false;
      };
    }

    const loadParticipants = async () => {
      const [awayRoster, homeRoster] = await Promise.all([
        getTeamRoster(awayTeamId),
        getTeamRoster(homeTeamId),
      ]);
      if (!isMounted) {
        return;
      }

      const athleteById = new Map<
        string,
        { athlete: RosterAthlete; team: TeamInfo }
      >();
      for (const athlete of awayRoster) {
        if (athlete.id) {
          athleteById.set(athlete.id, { athlete, team: selectedGame.away });
        }
      }
      for (const athlete of homeRoster) {
        if (athlete.id) {
          athleteById.set(athlete.id, { athlete, team: selectedGame.home });
        }
      }

      const trackedQuarterbacks = new Map<string, string>();
      for (
        let playIndex = gamePlays.length - 1;
        playIndex >= 0;
        playIndex -= 1
      ) {
        for (const participant of gamePlays[playIndex].participants) {
          const rosterEntry = athleteById.get(participant.athleteId);
          const teamId = rosterEntry?.team.id;
          if (
            teamId &&
            !trackedQuarterbacks.has(teamId) &&
            rosterEntry.athlete.position?.abbreviation?.toUpperCase() === "QB"
          ) {
            trackedQuarterbacks.set(teamId, participant.athleteId);
          }
        }
        if (trackedQuarterbacks.size === 2) {
          break;
        }
      }

      const participantIds = new Set(
        selectedPlay.participants.map((participant) => participant.athleteId),
      );
      const getPriorityIds = (team: TeamInfo) =>
        new Set(
          team.players.map((player) =>
            player.id.slice(player.id.indexOf("-") + 1),
          ),
        );
      const getPreferredPlayerIds = (roster: RosterAthlete[]) =>
        new Set(
          roster.flatMap((athlete) =>
            athlete.id && participantIds.has(athlete.id) ? [athlete.id] : [],
          ),
        );
      const getTrackedQuarterbackIds = (teamId: string | undefined) => {
        const quarterbackId = teamId
          ? trackedQuarterbacks.get(teamId)
          : undefined;
        return new Set(quarterbackId ? [quarterbackId] : []);
      };
      const awayIsOffense = awayTeamId === selectedPlay.offenseTeamId;
      const awaySpots = awayIsOffense
        ? offenseFormations[0]
        : defenseFormations[0];
      const homeSpots = awayIsOffense
        ? defenseFormations[0]
        : offenseFormations[0];
      const awayBoardPlayers = placeFormationPlayers(
        awayRoster,
        selectFormationPlayers(
          awayRoster,
          awaySpots,
          getPriorityIds(selectedGame.away),
          new Set(),
          getPreferredPlayerIds(awayRoster),
          getTrackedQuarterbackIds(awayTeamId),
        ),
        awaySpots,
        selectedGame.away,
      );
      const homeBoardPlayers = placeFormationPlayers(
        homeRoster,
        selectFormationPlayers(
          homeRoster,
          homeSpots,
          getPriorityIds(selectedGame.home),
          new Set(),
          getPreferredPlayerIds(homeRoster),
          getTrackedQuarterbackIds(homeTeamId),
        ),
        homeSpots,
        selectedGame.home,
      );
      setPlayBoardLineups({
        playId: selectedPlay.id,
        awayPlayers: awayBoardPlayers,
        homePlayers: homeBoardPlayers,
      });

      setPlayParticipantData({
        playId: selectedPlay.id,
        participants: selectedPlay.participants.flatMap((participant) => {
          const rosterEntry = athleteById.get(participant.athleteId);
          if (!rosterEntry?.team.id) {
            return [];
          }

          return [
            {
              id: participant.athleteId,
              name: rosterEntry.athlete.displayName ??
                rosterEntry.athlete.fullName ??
                "Unknown player",
              position:
                rosterEntry.athlete.position?.abbreviation ?? "ATH",
              jersey: String(rosterEntry.athlete.jersey ?? "00"),
              teamId: rosterEntry.team.id,
              role: participant.role,
              color: rosterEntry.team.color,
              player: {
                id: `${rosterEntry.team.abbreviation}-${participant.athleteId}`,
                name:
                  rosterEntry.athlete.displayName ??
                  rosterEntry.athlete.fullName ??
                  "Unknown player",
                position:
                  rosterEntry.athlete.position?.abbreviation ?? "ATH",
                jersey: String(rosterEntry.athlete.jersey ?? "00"),
                x: 0,
                y: 0,
                color: rosterEntry.team.color,
                info: `${rosterEntry.athlete.position?.abbreviation ?? "ATH"} for the ${rosterEntry.team.name}.`,
                imageUrl:
                  rosterEntry.athlete.headshot?.href ??
                  `https://a.espncdn.com/i/headshots/nfl/players/full/${participant.athleteId}.png`,
              },
            },
          ];
        }),
      });
    };

    loadParticipants().catch((error: unknown) => {
      console.warn(
        `Could not resolve players for play ${selectedPlay.id}`,
        error,
      );
      if (isMounted) {
        setPlayParticipantData({
          playId: selectedPlay.id,
          participants: [],
          error: true,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [gamePlays, selectedGame.away, selectedGame.home, selectedPlay]);

  const offenseIsAway =
    selectedPlay?.offenseTeamId !== undefined &&
    selectedPlay.offenseTeamId === selectedGame.away.id;
  const offenseAttacksRight =
    selectedPlay && selectedPlay.period > 0
      ? selectedPlay.period % 2 === 0
        ? !offenseIsAway
        : offenseIsAway
      : offenseIsAway;
  const fieldLeftTeam =
    selectedPlay && selectedGame.away.id && selectedGame.home.id
      ? offenseAttacksRight
        ? selectedGame.away.id === selectedPlay.offenseTeamId
          ? selectedGame.home
          : selectedGame.away
        : selectedGame.away.id === selectedPlay.offenseTeamId
          ? selectedGame.away
          : selectedGame.home
      : selectedGame.away;
  const fieldRightTeam =
    fieldLeftTeam.id === selectedGame.away.id
      ? selectedGame.home
      : selectedGame.away;
  const playStartX = selectedPlay
    ? getFieldXFromYardsToEndzone(
        selectedPlay.start?.yardsToEndzone,
        offenseAttacksRight,
      )
    : undefined;
  const playEndX = selectedPlay
    ? getFieldXFromYardsToEndzone(
        selectedPlay.end?.yardsToEndzone,
        offenseAttacksRight,
      )
    : undefined;
  const playBoardDirection = offenseAttacksRight ? 1 : -1;
  const lineToGainX =
    playStartX !== undefined &&
    selectedPlay?.start?.distance !== undefined &&
    Number.isFinite(selectedPlay.start.distance) &&
    selectedPlay.start.distance >= 0
      ? Math.max(
          100,
          Math.min(
            FIELD_WIDTH - 100,
            playStartX +
              playBoardDirection * selectedPlay.start.distance * 10,
          ),
        )
      : undefined;
  const playBoardLineX = playStartX ?? FIELD_WIDTH / 2;
  const fieldAwayTeam =
    selectedPlay && playBoardLineups?.playId === selectedPlay.id
      ? { ...selectedGame.away, players: playBoardLineups.awayPlayers }
      : selectedGame.away;
  const fieldHomeTeam =
    selectedPlay && playBoardLineups?.playId === selectedPlay.id
      ? { ...selectedGame.home, players: playBoardLineups.homePlayers }
      : selectedGame.home;
  const isPlayerNamedInSelectedPlay = (team: TeamInfo, player: Player) =>
    playParticipants.some(
      (participant) =>
        participant.teamId === team.id &&
        player.id.endsWith(`-${participant.id}`),
    );
  const fieldTeams = [fieldAwayTeam, fieldHomeTeam];
  const fieldPlayerCount = fieldTeams.reduce(
    (count, team) => count + team.players.length,
    0,
  );
  const identifiedFieldPlayerCount = fieldTeams.reduce(
    (count, team) =>
      count +
      team.players.filter((player) => isPlayerNamedInSelectedPlay(team, player))
        .length,
    0,
  );

  const renderField = () => (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <Rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="#2E8B57" />
      <Rect width="100" height={FIELD_HEIGHT} fill="#1b5e20" />
      <Rect
        x={FIELD_WIDTH - 100}
        width="100"
        height={FIELD_HEIGHT}
        fill="#1b5e20"
      />

      {[...Array(12)].map((_, index) => {
        const x = index * 100;
        return (
          <Line
            key={`yard-${index}`}
            x1={x}
            y1={0}
            x2={x}
            y2={FIELD_HEIGHT}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3"
          />
        );
      })}

      <Line
        x1={FIELD_WIDTH / 2}
        y1={0}
        x2={FIELD_WIDTH / 2}
        y2={FIELD_HEIGHT}
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="6"
      />

      {selectedPlay && playStartX !== undefined ? (
        <G>
          {lineToGainX !== undefined ? (
            <G>
              <Line
                x1={lineToGainX}
                y1={0}
                x2={lineToGainX}
                y2={FIELD_HEIGHT}
                stroke="#38bdf8"
                strokeDasharray="10 8"
                strokeWidth="5"
              />
              <SvgText
                x={lineToGainX}
                y={26}
                fill="#38bdf8"
                fontSize="15"
                fontWeight="700"
                textAnchor="middle"
              >
                TO GAIN
              </SvgText>
            </G>
          ) : null}
          <Line
            x1={playStartX}
            y1={0}
            x2={playStartX}
            y2={FIELD_HEIGHT}
            stroke="#facc15"
            strokeDasharray="14 10"
            strokeWidth="5"
          />
          <SvgText
            x={playStartX}
            y={FIELD_HEIGHT - 16}
            fill="#facc15"
            fontSize="16"
            fontWeight="700"
            textAnchor="middle"
          >
            LOS
          </SvgText>
          {playEndX !== undefined ? (
            <G>
              <Line
                x1={playStartX}
                y1={FIELD_HEIGHT / 2}
                x2={playEndX}
                y2={FIELD_HEIGHT / 2}
                stroke="#facc15"
                strokeWidth="5"
              />
              <Circle
                cx={playEndX}
                cy={FIELD_HEIGHT / 2}
                r={10}
                fill="#facc15"
                stroke="#17212b"
                strokeWidth="3"
              />
            </G>
          ) : null}
        </G>
      ) : null}

      <SvgText
        x={60}
        y={FIELD_HEIGHT / 2}
        fill="white"
        fontSize="28"
        fontWeight="700"
        transform={`rotate(-90 60 ${FIELD_HEIGHT / 2})`}
      >
        {fieldLeftTeam.abbreviation}
      </SvgText>

      <SvgText
        x={FIELD_WIDTH - 60}
        y={FIELD_HEIGHT / 2}
        fill="white"
        fontSize="28"
        fontWeight="700"
        transform={`rotate(90 ${FIELD_WIDTH - 60} ${FIELD_HEIGHT / 2})`}
      >
        {fieldRightTeam.abbreviation}
      </SvgText>

      {selectedPlay
        ? playParticipants.flatMap((participant) => {
            const team =
              participant.teamId === fieldAwayTeam.id
                ? fieldAwayTeam
                : participant.teamId === fieldHomeTeam.id
                  ? fieldHomeTeam
                  : undefined;
            const player = team?.players.find((candidate) =>
              candidate.id.endsWith(`-${participant.id}`),
            );
            if (!team || !player) {
              return [];
            }

            const offense = team.id === selectedPlay.offenseTeamId;
            const position = getSchematicPlayerPosition(
              team,
              player,
              offense,
              playBoardLineX,
              playBoardDirection,
            );
            const role = participant.role.toLowerCase();
            const isBallCarrier =
              offense &&
              (role.includes("rush") ||
                role.includes("runner") ||
                /rush|run|scramble/i.test(selectedPlay.type));
            const isDefender = team.id === selectedPlay.defenseTeamId;
            const targetX = Math.max(
              110,
              Math.min(
                FIELD_WIDTH - 110,
                isDefender || isBallCarrier
                  ? (playEndX ?? playBoardLineX + playBoardDirection * 95)
                  : position.x + playBoardDirection * 125,
              ),
            );
            const targetY =
              isDefender || isBallCarrier
                ? FIELD_HEIGHT / 2
                : position.y < FIELD_HEIGHT / 2
                  ? Math.max(55, position.y - 95)
                  : Math.min(FIELD_HEIGHT - 55, position.y + 95);
            const arrowX = targetX - position.x;
            const arrowY = targetY - position.y;
            const arrowLength = Math.hypot(arrowX, arrowY) || 1;
            const unitX = arrowX / arrowLength;
            const unitY = arrowY / arrowLength;
            const baseX = targetX - unitX * 18;
            const baseY = targetY - unitY * 18;
            const perpendicularX = -unitY * 9;
            const perpendicularY = unitX * 9;
            const arrowPoints = `${targetX},${targetY} ${
              baseX + perpendicularX
            },${baseY + perpendicularY} ${baseX - perpendicularX},${
              baseY - perpendicularY
            }`;

            return [
              <G key={`route-${selectedPlay.id}-${participant.id}`}>
                <Line
                  x1={position.x}
                  y1={position.y}
                  x2={baseX}
                  y2={baseY}
                  stroke="#facc15"
                  strokeWidth="4"
                  strokeDasharray="10 7"
                  opacity="0.9"
                />
                <Polygon points={arrowPoints} fill="#facc15" />
              </G>,
            ];
          })
        : null}

      {[fieldAwayTeam, fieldHomeTeam].flatMap((team) => (
        <G key={`${team.abbreviation}-formation`}>
          <SvgText
            x={
              team.abbreviation === selectedGame.away.abbreviation
                ? FIELD_WIDTH * 0.25
                : FIELD_WIDTH * 0.75
            }
            y={38}
            fill="white"
            fontSize="16"
            fontWeight="700"
            textAnchor="middle"
          >
            {selectedPlay
              ? team.id === selectedPlay.offenseTeamId
                ? "OFFENSE"
                : "DEFENSE"
              : team.role.toUpperCase()}
          </SvgText>
          {selectedPlay
            ? team.players.map((player) => {
                const offense = team.id === selectedPlay.offenseTeamId;
                const { x, y } = getSchematicPlayerPosition(
                  team,
                  player,
                  offense,
                  playBoardLineX,
                  playBoardDirection,
                );
                const participant = isPlayerNamedInSelectedPlay(team, player);
                const tokenRadius = participant ? 21 : 17;

                return (
                  <G
                    key={`${team.abbreviation}-${player.id}`}
                    onClick={
                      Platform.OS === "web"
                        ? () => setSelectedPlayer(player)
                        : undefined
                    }
                    onPress={
                      Platform.OS !== "web"
                        ? () => setSelectedPlayer(player)
                        : undefined
                    }
                  >
                    <SvgText
                      x={x}
                      y={y - tokenRadius - 7}
                      fill="white"
                      fontSize="10"
                      fontWeight={participant ? "700" : "400"}
                      textAnchor="middle"
                    >
                      {player.name}
                    </SvgText>
                    <Circle
                      cx={x}
                      cy={y}
                      r={tokenRadius}
                      fill={player.color}
                      stroke={participant ? "#facc15" : team.alternateColor}
                      strokeWidth={participant ? "6" : "3"}
                    />
                    <SvgText
                      x={x}
                      y={y + 4}
                      fill="white"
                      fontSize="12"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {player.jersey}
                    </SvgText>
                    <SvgText
                      x={x}
                      y={y + tokenRadius + 13}
                      fill="white"
                      fontSize="9"
                      fontWeight={participant ? "700" : "400"}
                      textAnchor="middle"
                    >
                      {player.position}
                    </SvgText>
                  </G>
                );
              })
            : team.players.map((player) => (
                <G
                  key={`${team.abbreviation}-${player.id}`}
                  onClick={
                    Platform.OS === "web"
                      ? () => setSelectedPlayer(player)
                      : undefined
                  }
                  onPress={
                    Platform.OS !== "web"
                      ? () => setSelectedPlayer(player)
                      : undefined
                  }
                >
                  <SvgText
                    x={player.x}
                    y={player.y - 14 - 7}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {player.name}
                  </SvgText>
                  <Circle
                    cx={player.x}
                    cy={player.y}
                    r={14}
                    fill={player.color}
                    stroke={team.alternateColor}
                    strokeWidth="3"
                  />
                  <SvgText
                    x={player.x}
                    y={player.y + 4}
                    fill="white"
                    fontSize="12"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {player.jersey}
                  </SvgText>
                  <SvgText
                    x={player.x}
                    y={player.y + 14 + 13}
                    fill="white"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {player.position}
                  </SvgText>
                </G>
              ))}
        </G>
      ))}
    </Svg>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator
    >
      <View style={styles.headerPanel}>
        <Text style={styles.title}>NFL Match View</Text>
        <Text style={styles.subtitle}>{selectedGame.status}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gameStrip}
      >
        {games.map((game) => (
          <Pressable
            key={game.id}
            onPress={() => setSelectedGameId(game.id)}
            style={[
              styles.gameChip,
              game.id === selectedGame.id && styles.gameChipActive,
            ]}
          >
            <View style={styles.gameChipMatchup}>
              <View style={styles.gameChipTeamRow}>
                <View style={styles.gameChipTeamLogoSlot}>
                  {game.away.logoUrl ? (
                    <Image
                      source={{ uri: game.away.logoUrl }}
                      style={styles.gameChipTeamLogo}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
                <Text style={styles.gameTeamText} numberOfLines={1}>
                  {game.away.name}
                </Text>
                <View style={styles.gameChipScoreSlot}>
                  {game.away.score !== undefined ? (
                    <Text style={styles.gameChipScore}>
                      {game.away.score}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.gameMatchupText}>
                {game.isFinal ? "Final" : "at"}
              </Text>
              <View style={styles.gameChipTeamRow}>
                <View style={styles.gameChipScoreSlot}>
                  {game.home.score !== undefined ? (
                    <Text style={styles.gameChipScore}>
                      {game.home.score}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.gameTeamText} numberOfLines={1}>
                  {game.home.name}
                </Text>
                <View style={styles.gameChipTeamLogoSlot}>
                  {game.home.logoUrl ? (
                    <Image
                      source={{ uri: game.home.logoUrl }}
                      style={styles.gameChipTeamLogo}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
            </View>
            <Text style={styles.gameChipSub}>{game.status}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.teamsRow}>
        <Text style={styles.teamText}>
          {selectedGame.away.name}
          {selectedGame.isFinal && selectedGame.away.score !== undefined
            ? ` ${selectedGame.away.score}`
            : ""}
        </Text>
        <Text style={styles.vsText}>
          {selectedGame.isFinal ? "Final" : "@"}
        </Text>
        <Text style={styles.teamText}>
          {selectedGame.home.name}
          {selectedGame.isFinal && selectedGame.home.score !== undefined
            ? ` ${selectedGame.home.score}`
            : ""}
        </Text>
      </View>

      <Pressable onPress={() => setIsFieldExpanded(true)}>
        <View style={styles.fieldShell}>{renderField()}</View>
      </Pressable>

      <View style={styles.playActionCard}>
        <View style={styles.playActionHeader}>
          <View style={styles.playActionTitleGroup}>
            <Text style={styles.playActionTitle}>Play action</Text>
            <Text style={styles.playActionCount}>
              {gamePlays.length > 0
                ? `Play ${selectedPlayIndex + 1} of ${gamePlays.length}`
                : ""}
            </Text>
          </View>
          <View style={styles.playActionControls}>
            {gamePlays.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose a play"
                accessibilityState={{ expanded: isPlayPickerOpen }}
                onPress={() => setIsPlayPickerOpen((isOpen) => !isOpen)}
                style={styles.playActionButton}
              >
                <Text style={styles.playActionButtonText}>
                  Play {selectedPlayIndex + 1} ▾
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous play"
              disabled={!selectedPlay || selectedPlayIndex === 0}
              onPress={() =>
                setPlayCursor((cursor) => ({
                  gameId: selectedGame.id,
                  index: Math.max(
                    0,
                    (cursor.gameId === selectedGame.id ? cursor.index : 0) - 1,
                  ),
                }))
              }
              style={[
                styles.playActionButton,
                (!selectedPlay || selectedPlayIndex === 0) &&
                  styles.playActionButtonDisabled,
              ]}
            >
              <Text style={styles.playActionButtonText}>Previous</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next play"
              disabled={
                !selectedPlay || selectedPlayIndex >= gamePlays.length - 1
              }
              onPress={() =>
                setPlayCursor((cursor) => ({
                  gameId: selectedGame.id,
                  index: Math.min(
                    gamePlays.length - 1,
                    (cursor.gameId === selectedGame.id ? cursor.index : 0) + 1,
                  ),
                }))
              }
              style={[
                styles.playActionButton,
                (!selectedPlay || selectedPlayIndex >= gamePlays.length - 1) &&
                  styles.playActionButtonDisabled,
              ]}
            >
              <Text style={styles.playActionButtonText}>Next</Text>
            </Pressable>
          </View>
        </View>

        {isPlayPickerOpen && gamePlays.length > 0 ? (
          <ScrollView
            style={styles.playPicker}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {gamePlays
              .map((play, index) => ({ play, index }))
              .reverse()
              .map(({ play, index }) => {
                const down = play.start?.down;
                const downAndDistance =
                  down !== undefined
                    ? ` · ${["1st", "2nd", "3rd", "4th"][down - 1] ?? `${down}th`} & ${play.start?.distance ?? "?"}`
                    : "";
                const description = play.shortText?.trim() || play.text;

                return (
                  <Pressable
                    key={play.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${index + 1}${downAndDistance} · ${description}`}
                    accessibilityState={{
                      selected: index === selectedPlayIndex,
                    }}
                    onPress={() => {
                      setPlayCursor({ gameId: selectedGame.id, index });
                      setIsPlayPickerOpen(false);
                    }}
                    style={[
                      styles.playPickerItem,
                      index === selectedPlayIndex &&
                        styles.playPickerItemSelected,
                    ]}
                  >
                    <Text style={styles.playPickerItemText} numberOfLines={2}>
                      {`Play ${index + 1}${
                        play.period > 0 ? ` · Q${play.period}` : ""
                      }${play.clock ? ` · ${play.clock}` : ""}${downAndDistance} · ${description}`}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>
        ) : null}

        {isLoadingPlays ? (
          <Text style={styles.playActionMuted}>Loading game plays…</Text>
        ) : playError ? (
          <Text style={styles.playActionMuted}>{playError}</Text>
        ) : selectedPlay ? (
          <>
            <Text style={styles.playActionSituation}>
              {selectedPlay.period > 0 ? `Q${selectedPlay.period} • ` : ""}
              {selectedPlay.clock}
              {selectedPlay.start?.down !== undefined
                ? ` • ${
                    ["1st", "2nd", "3rd", "4th"][selectedPlay.start.down - 1] ??
                    `${selectedPlay.start.down}th`
                  } & ${selectedPlay.start.distance ?? "?"}`
                : ""}
              {selectedPlay.start?.possessionText
                ? ` • ${selectedPlay.start.possessionText}`
                : ""}
            </Text>
            <Text style={styles.playActionTeams}>
              {selectedGame.away.id === selectedPlay.offenseTeamId
                ? selectedGame.away.name
                : selectedGame.home.name}{" "}
              offense ·{" "}
              {selectedGame.away.id === selectedPlay.defenseTeamId
                ? selectedGame.away.name
                : selectedGame.home.name}{" "}
              defense
            </Text>
            <Text style={styles.playActionMuted}>
              11-on-11 board · yellow rings and arrows mark players named in
              this play
            </Text>
            <Text style={styles.playActionDescription}>
              {selectedPlay.shortText?.trim() || selectedPlay.text}
            </Text>
            {selectedPlay.shortText &&
            selectedPlay.shortText !== selectedPlay.text ? (
              <Text style={styles.playActionPlayByPlay}>
                Play-by-play: {selectedPlay.text}
              </Text>
            ) : null}
            <Text style={styles.playActionParticipantsTitle}>
              Players identified in this play
            </Text>
            {playParticipantError ? (
              <Text style={styles.playActionMuted}>
                Player names could not be resolved for this play.
              </Text>
            ) : isLoadingPlayParticipants ? (
              <Text style={styles.playActionMuted}>
                Loading participant names…
              </Text>
            ) : playParticipants.length > 0 ? (
              <View style={styles.playParticipantList}>
                {playParticipants.map((participant) => (
                  <Pressable
                    key={`${selectedPlay.id}-${participant.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${participant.name}, number ${participant.jersey}, ${participant.position}, ${
                      participant.teamId === selectedPlay.offenseTeamId
                        ? "offense"
                        : "defense"
                    }. View player details`}
                    style={styles.playParticipant}
                    onPress={() => setSelectedPlayer(participant.player)}
                  >
                    <View
                      style={[
                        styles.playParticipantDot,
                        { backgroundColor: participant.color },
                      ]}
                    />
                    <Text style={styles.playParticipantText}>
                      {participant.position} · {participant.name} · #
                      {participant.jersey}
                    </Text>
                    <Text style={styles.playParticipantSide}>
                      {participant.teamId === selectedPlay.offenseTeamId
                        ? "OFF"
                        : "DEF"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.playActionMuted}>
                No named players were listed for this play.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.playActionMuted}>
            {selectedGame.id.startsWith("demo-")
              ? "Play-by-play is available for live or completed ESPN games."
              : "No play-by-play is available for this game yet."}
          </Text>
        )}
        <Text style={styles.playActionDisclaimer}>
          ESPN does not provide the full snap lineup or player tracking. The
          11-player units, positions, and arrows are schematic estimates; only
          participants listed in the play record are highlighted.
        </Text>
      </View>

      <View style={styles.lineupSection}>
        <Text style={styles.lineupTitle}>Team Rosters</Text>
        <Text style={styles.lineupSummary}>
          {fieldPlayerCount} players shown
          {selectedPlay
            ? ` · ${identifiedFieldPlayerCount} identified in this play`
            : ""}
        </Text>
        {fieldPlayerCount === 0 &&
        !selectedGame.id.startsWith("demo-") &&
        lineupLoadState?.gameId === selectedGame.id &&
        lineupLoadState.status === "error" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setLineupRetryKey((key) => key + 1)}
          >
            <Text style={styles.playActionMuted}>
              Could not load this game’s lineup. Tap to retry.
            </Text>
          </Pressable>
        ) : fieldPlayerCount === 0 &&
          !selectedGame.id.startsWith("demo-") &&
          lineupLoadState?.gameId === selectedGame.id &&
          lineupLoadState.status === "loaded" ? (
          <Text style={styles.playActionMuted}>
            No field lineup is available for this game yet.
          </Text>
        ) : fieldPlayerCount === 0 && !selectedGame.id.startsWith("demo-") ? (
          <Text style={styles.playActionMuted}>
            Loading lineup for selected game…
          </Text>
        ) : null}
        <View style={styles.lineupList}>
          {fieldTeams.map((team) => (
            <View key={team.abbreviation} style={styles.teamRoster}>
              <View style={styles.teamRosterHeader}>
                {team.logoUrl ? (
                  <Image
                    source={{ uri: team.logoUrl }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : null}
                <Text style={styles.teamRosterName}>{team.name}</Text>
                <Text style={styles.teamRosterRole}>
                  {selectedPlay
                    ? team.id === selectedPlay.offenseTeamId
                      ? "OFFENSE"
                      : "DEFENSE"
                    : team.role}
                </Text>
              </View>
              {getPlayerGroups(team.players).map((group) => (
                <View key={group.title} style={styles.playerGroup}>
                  <View style={styles.playerGroupHeader}>
                    <View style={styles.playerGroupTitleRow}>
                      <Text style={styles.playerGroupTitle}>{group.title}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`About ${group.title}`}
                        style={styles.groupInfoButton}
                        onPress={() => setSelectedGroupInfo(group.title)}
                      >
                        <Text style={styles.groupInfoIcon}>i</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.playerGroupCount}>
                      {group.players.length}
                    </Text>
                  </View>
                  {group.players.map((player) => (
                    <Pressable
                      key={player.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${player.name}, number ${player.jersey}, ${player.position}${
                        isPlayerNamedInSelectedPlay(team, player)
                          ? ", identified in selected play"
                          : ""
                      }`}
                      style={styles.playerRow}
                      onPress={() => setSelectedPlayer(player)}
                    >
                      <View
                        style={[
                          styles.jerseyDot,
                          { backgroundColor: player.color },
                        ]}
                      />
                      <Text style={styles.playerName}>
                        {player.name}
                        <Text style={styles.playerJersey}>
                          {" "}
                          #{player.jersey}
                        </Text>
                      </Text>
                      {isPlayerNamedInSelectedPlay(team, player) ? (
                        <Text style={styles.playerInPlay}>IN PLAY</Text>
                      ) : null}
                      <Text style={styles.playerPosition}>
                        {player.position}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(selectedPlayer)}
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedPlayer(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.playerModalHeader}>
              {selectedPlayer?.imageUrl ? (
                <Image
                  source={{ uri: selectedPlayer.imageUrl }}
                  style={styles.playerPortrait}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.playerPortraitFallback,
                    { backgroundColor: selectedPlayer?.color ?? "#1b7fe0" },
                  ]}
                >
                  <Text style={styles.playerPortraitFallbackText}>
                    {selectedPlayer?.position ?? "ATH"}
                  </Text>
                </View>
              )}
              <View style={styles.playerModalMeta}>
                <Text style={styles.modalTitle}>
                  {selectedPlayer?.name ?? "Player"}
                </Text>
                <Text style={styles.modalPosition}>
                  {selectedPlayer?.position ?? "Position"}
                </Text>
                <Text style={styles.modalJersey}>
                  #{selectedPlayer?.jersey ?? "00"}
                </Text>
              </View>
            </View>
            <Text style={styles.modalInfo}>
              {selectedPlayer
                ? getPlayerPlaystyleSummary(selectedPlayer)
                : "Player information unavailable."}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedPlayer(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(selectedGroupInfo)}
        onRequestClose={() => setSelectedGroupInfo(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedGroupInfo(null)}
        >
          <Pressable style={styles.groupInfoCard} onPress={() => {}}>
            <Text style={styles.groupInfoTitle}>{selectedGroupInfo}</Text>
            <ScrollView
              style={styles.groupInfoScroll}
              showsVerticalScrollIndicator
            >
              <Text style={styles.groupInfoSectionTitle}>Objective</Text>
              <Text style={styles.groupInfoBody}>
                {positionGroupInfo[selectedGroupInfo ?? ""]?.objective}
              </Text>
              <Text style={styles.groupInfoSectionTitle}>Roles</Text>
              {positionGroupInfo[selectedGroupInfo ?? ""]?.roles.map((role) => (
                <View key={role.name} style={styles.groupRole}>
                  <Text style={styles.groupRoleName}>{role.name}</Text>
                  <Text style={styles.groupInfoBody}>{role.description}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedGroupInfo(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={isFieldExpanded}
        onRequestClose={() => setIsFieldExpanded(false)}
      >
        <Pressable
          style={styles.expandedFieldBackdrop}
          onPress={() => setIsFieldExpanded(false)}
        >
          <View
            style={[
              styles.expandedFieldFrame,
              {
                width: EXPANDED_WINDOW_WIDTH,
                height: EXPANDED_WINDOW_HEIGHT,
                transform: "rotate(90deg)",
              },
            ]}
          >
            <View style={styles.expandedFieldStage}>{renderField()}</View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Styles for the screen, field, player groups, and modal panels.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#10151d",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
  },
  headerPanel: {
    marginBottom: 10,
  },
  title: {
    color: "#f5f7fb",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9fb3c8",
    fontSize: 14,
    marginTop: 4,
  },
  gameStrip: {
    height: 142,
    flexGrow: 0,
    marginBottom: 12,
  },
  gameChip: {
    backgroundColor: "#1a2532",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
    width: 250,
    minHeight: 124,
    borderWidth: 1,
    borderColor: "#2d3d4d",
    alignItems: "center",
    justifyContent: "center",
  },
  gameChipActive: {
    borderColor: "#7cc4ff",
    backgroundColor: "#13283f",
  },
  gameChipMatchup: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  gameChipTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    justifyContent: "center",
  },
  gameChipTeamLogoSlot: {
    width: 28,
    height: 28,
    flexShrink: 0,
  },
  gameChipScoreSlot: {
    width: 28,
    minHeight: 28,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  gameChipScore: {
    color: "#f5f7fb",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  gameChipTeamLogo: {
    width: 28,
    height: 28,
  },
  gameTeamText: {
    color: "#f5f7fb",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  gameMatchupText: {
    color: "#8bbaf1",
    fontSize: 11,
    fontWeight: "700",
    marginVertical: 2,
  },
  gameChipSub: {
    color: "#9fb3c8",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  teamText: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  vsText: {
    color: "#9fb3c8",
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 8,
  },
  fieldShell: {
    height: 310,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1d2c22",
    borderWidth: 2,
    borderColor: "#3e5d47",
  },
  playActionCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0d1722",
    borderWidth: 1,
    borderColor: "#213244",
    gap: 10,
  },
  playActionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  playActionTitleGroup: {
    flex: 1,
    gap: 3,
  },
  playActionTitle: {
    color: "#f5f7fb",
    fontSize: 18,
    fontWeight: "700",
  },
  playActionCount: {
    color: "#9fb3c8",
    fontSize: 12,
  },
  playActionControls: {
    flexDirection: "row",
    gap: 8,
  },
  playPicker: {
    maxHeight: 190,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#35506a",
    backgroundColor: "#101d2a",
  },
  playPickerItem: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#213244",
  },
  playPickerItemSelected: {
    backgroundColor: "#1a2a3a",
  },
  playPickerItemText: {
    color: "#d9e7f5",
    fontSize: 12,
    lineHeight: 17,
  },
  playActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1a2a3a",
    borderWidth: 1,
    borderColor: "#35506a",
  },
  playActionButtonDisabled: {
    opacity: 0.45,
  },
  playActionButtonText: {
    color: "#d9e7f5",
    fontSize: 12,
    fontWeight: "700",
  },
  playActionSituation: {
    color: "#8bbaf1",
    fontSize: 13,
    fontWeight: "700",
  },
  playActionTeams: {
    color: "#9fb3c8",
    fontSize: 12,
    textTransform: "uppercase",
  },
  playActionDescription: {
    color: "#f5f7fb",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  playActionPlayByPlay: {
    color: "#c2d0df",
    fontSize: 13,
    lineHeight: 19,
  },
  playActionParticipantsTitle: {
    color: "#f5f7fb",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  playParticipantList: {
    gap: 6,
  },
  playParticipant: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
  },
  playParticipantDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playParticipantText: {
    color: "#d9e7f5",
    fontSize: 13,
    flex: 1,
  },
  playParticipantSide: {
    color: "#8bbaf1",
    fontSize: 10,
    fontWeight: "700",
  },
  playActionMuted: {
    color: "#9fb3c8",
    fontSize: 13,
    lineHeight: 19,
  },
  playActionDisclaimer: {
    color: "#76899b",
    fontSize: 11,
    lineHeight: 16,
  },
  lineupSection: {
    marginTop: 16,
  },
  lineupTitle: {
    color: "#f5f7fb",
    fontSize: 18,
    fontWeight: "700",
  },
  lineupSummary: {
    color: "#9fb3c8",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  lineupList: {
    gap: 12,
    paddingBottom: 6,
  },
  teamRoster: {
    gap: 8,
    backgroundColor: "#0d1722",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#213244",
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  teamRosterHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#294052",
  },
  teamColorMark: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 8,
  },
  teamRosterName: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  teamRosterRole: {
    color: "#8bbaf1",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  playerGroup: {
    gap: 2,
  },
  playerGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  playerGroupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  playerGroupTitle: {
    color: "#9fb3c8",
    fontSize: 12,
    fontWeight: "700",
  },
  groupInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#71889c",
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfoIcon: {
    color: "#c8d5e3",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  playerGroupCount: {
    color: "#71889c",
    fontSize: 11,
    fontWeight: "700",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#182b3d",
  },
  jerseyDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 10,
  },
  playerName: {
    color: "#f5f7fb",
    fontSize: 15,
    flex: 1,
  },
  playerJersey: {
    color: "#8bbaf1",
    fontSize: 13,
    fontWeight: "700",
  },
  playerInPlay: {
    color: "#facc15",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 10,
  },
  playerPosition: {
    color: "#8bbaf1",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 12, 18, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#111b27",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#25405f",
  },
  playerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerPortrait: {
    width: 92,
    height: 92,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: "#1d2a38",
  },
  playerPortraitFallback: {
    width: 92,
    height: 92,
    borderRadius: 18,
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  playerPortraitFallbackText: {
    color: "#f5f7fb",
    fontSize: 16,
    fontWeight: "800",
  },
  playerModalMeta: {
    flex: 1,
  },
  modalTitle: {
    color: "#f5f7fb",
    fontSize: 22,
    fontWeight: "800",
  },
  modalPosition: {
    color: "#8cc7ff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  modalJersey: {
    color: "#dfeaf6",
    fontSize: 14,
    marginTop: 8,
  },
  modalInfo: {
    color: "#c8d5e3",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  groupInfoCard: {
    width: "92%",
    maxHeight: "82%",
    backgroundColor: "#111b27",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#25405f",
  },
  groupInfoTitle: {
    color: "#f5f7fb",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  groupInfoScroll: {
    flexShrink: 1,
  },
  groupInfoSectionTitle: {
    color: "#8cc7ff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  groupInfoBody: {
    color: "#c8d5e3",
    fontSize: 14,
    lineHeight: 20,
  },
  groupRole: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#213244",
  },
  groupRoleName: {
    color: "#f5f7fb",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: "#1b7fe0",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#f5f7fb",
    fontSize: 15,
    fontWeight: "700",
  },
  expandedFieldBackdrop: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    margin: 0,
  },
  expandedFieldFrame: {
    width: EXPANDED_WINDOW_WIDTH,
    height: EXPANDED_WINDOW_HEIGHT,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    padding: 0,
    overflow: "hidden",
  },
  expandedFieldStage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: 0,
  },
});
