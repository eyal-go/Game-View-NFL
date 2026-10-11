import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";

type Player = {
  id: string;
  name: string;
  position: string;
  jersey: string;
  x: number;
  y: number;
  color: string;
  info: string;
};

type TeamInfo = {
  name: string;
  abbreviation: string;
  color: string;
  alternateColor: string;
  role: "offense" | "defense";
  players: Player[];
};

type Game = {
  id: string;
  status: string;
  away: TeamInfo;
  home: TeamInfo;
};

type RosterAthlete = {
  id?: string;
  displayName?: string;
  fullName?: string;
  jersey?: string | number;
  position?: {
    abbreviation?: string;
  };
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
const formationCache = new Map<string, GameFormationPlan>();

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
    ...[235, 300, 365].map((y) => ({
      role: "defensiveLine" as const,
      x: 625,
      y,
    })),
    ...[150, 250, 350, 450].map((y) => ({
      role: "linebacker" as const,
      x: 655,
      y,
    })),
    ...[85, 210, 390, 515].map((y) => ({
      role: "defensiveBack" as const,
      x: 685,
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
    .catch(() => {
      rosterCache.delete(teamId);
      return [];
    });

  rosterCache.set(teamId, rosterRequest);
  return rosterRequest;
};

const selectFormationPlayers = (
  athletes: RosterAthlete[],
  spots: FormationSpot[],
): string[] => {
  const available = athletes.filter(
    (athlete): athlete is RosterAthlete & { id: string } => Boolean(athlete.id),
  );

  return spots.flatMap((spot) => {
    if (available.length === 0) {
      return [];
    }

    const eligiblePositions = rolePositions[spot.role];
    const eligibleIndices = available.flatMap((athlete, index) =>
      eligiblePositions.includes(athlete.position?.abbreviation ?? "")
        ? [index]
        : [],
    );
    const candidateIndices =
      eligibleIndices.length > 0
        ? eligibleIndices
        : available.map((_, index) => index);
    const selectedIndex =
      candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
    const [selected] = available.splice(selectedIndex, 1);
    return selected ? [selected.id] : [];
  });
};

const getFormationPlan = (
  gameId: string,
  awayTeamId: string,
  homeTeamId: string,
  awayRoster: RosterAthlete[],
  homeRoster: RosterAthlete[],
): GameFormationPlan => {
  const cachedPlan = formationCache.get(gameId);
  if (
    cachedPlan?.awayTeamId === awayTeamId &&
    cachedPlan.homeTeamId === homeTeamId &&
    cachedPlan.awayPlayerIds.length > 0 &&
    cachedPlan.homePlayerIds.length > 0
  ) {
    return cachedPlan;
  }

  const awayIsOffense = Math.random() < 0.5;
  const offenseSpots =
    offenseFormations[Math.floor(Math.random() * offenseFormations.length)];
  const defenseSpots =
    defenseFormations[Math.floor(Math.random() * defenseFormations.length)];
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
    awayPlayerIds: selectFormationPlayers(awayRoster, awaySpots),
    homePlayerIds: selectFormationPlayers(homeRoster, homeSpots),
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
    return [
      {
        id: `${team.abbreviation}-${id}`,
        name: athlete.displayName ?? athlete.fullName ?? "Unknown player",
        position,
        jersey: String(athlete.jersey ?? "00"),
        x: spot.x,
        y: spot.y,
        color: team.color,
        info: `${position} for the ${team.name}.`,
      },
    ];
  });
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

const getLiveGames = async (): Promise<Game[]> => {
  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    );

    if (!response.ok) {
      return demoGames;
    }

    const data = await response.json();
    const events = Array.isArray(data?.events) ? data.events : [];

    if (events.length === 0) {
      return demoGames;
    }

    return Promise.all(
      events.slice(0, 3).map(async (event: any) => {
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
        const status =
          event.status?.type?.detail ??
          event.status?.type?.description ??
          "Scheduled";

        const formatTeam = (
          team: any,
          fallback: TeamInfo,
          role: "offense" | "defense",
        ): TeamInfo => ({
          name: team?.displayName ?? fallback.name,
          abbreviation: team?.abbreviation ?? fallback.abbreviation,
          color: team?.color ? `#${team.color}` : fallback.color,
          alternateColor: team?.alternateColor
            ? `#${team.alternateColor}`
            : fallback.alternateColor,
          role,
          players: [],
        });

        const awayTeamId = awayTeam?.id ? String(awayTeam.id) : "";
        const homeTeamId = homeTeam?.id ? String(homeTeam.id) : "";
        const [awayRoster, homeRoster] = await Promise.all([
          awayTeamId ? getTeamRoster(awayTeamId) : Promise.resolve([]),
          homeTeamId ? getTeamRoster(homeTeamId) : Promise.resolve([]),
        ]);
        const formationPlan = getFormationPlan(
          String(event.id),
          awayTeamId,
          homeTeamId,
          awayRoster,
          homeRoster,
        );

        const away = formatTeam(
          awayTeam,
          demoGames[0].away,
          formationPlan.awayRole,
        );
        const home = formatTeam(
          homeTeam,
          demoGames[0].home,
          formationPlan.homeRole,
        );
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

        return {
          id: event.id,
          status,
          away,
          home,
        };
      }),
    );
  } catch (error) {
    return demoGames;
  }
};

export default function FieldScreen() {
  const [games, setGames] = useState<Game[]>(demoGames);
  const [selectedGameId, setSelectedGameId] = useState<string>(demoGames[0].id);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<string | null>(
    null,
  );
  const [isFieldExpanded, setIsFieldExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadGames = async () => {
      const liveGames = await getLiveGames();
      if (!isMounted) {
        return;
      }

      setGames(liveGames);
      if (!liveGames.some((game) => game.id === selectedGameId)) {
        setSelectedGameId(liveGames[0].id);
      }
    };

    loadGames();
    const interval = setInterval(loadGames, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedGameId]);

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

      <SvgText
        x={60}
        y={FIELD_HEIGHT / 2}
        fill="white"
        fontSize="28"
        fontWeight="700"
        transform={`rotate(-90 60 ${FIELD_HEIGHT / 2})`}
      >
        {selectedGame.away.abbreviation}
      </SvgText>

      <SvgText
        x={FIELD_WIDTH - 60}
        y={FIELD_HEIGHT / 2}
        fill="white"
        fontSize="28"
        fontWeight="700"
        transform={`rotate(90 ${FIELD_WIDTH - 60} ${FIELD_HEIGHT / 2})`}
      >
        {selectedGame.home.abbreviation}
      </SvgText>

      {[selectedGame.away, selectedGame.home].flatMap((team) => (
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
            {team.role.toUpperCase()}
          </SvgText>
          {team.players.map((player) => (
            <G key={player.id} onPress={() => setSelectedPlayer(player)}>
              <Circle
                cx={player.x}
                cy={player.y}
                r={18}
                fill={player.color}
                stroke={team.alternateColor}
                strokeWidth="3"
              />
              <SvgText
                x={player.x}
                y={player.y + 5}
                fill="white"
                fontSize="12"
                fontWeight="700"
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
              game.id === selectedGameId && styles.gameChipActive,
            ]}
          >
            <View style={styles.gameChipMatchup}>
              <Text style={styles.gameTeamText} numberOfLines={1}>
                {game.away.name}
              </Text>
              <Text style={styles.gameMatchupText}>at</Text>
              <Text style={styles.gameTeamText} numberOfLines={1}>
                {game.home.name}
              </Text>
            </View>
            <Text style={styles.gameChipSub}>{game.status}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.teamsRow}>
        <Text style={styles.teamText}>{selectedGame.away.name}</Text>
        <Text style={styles.vsText}>@</Text>
        <Text style={styles.teamText}>{selectedGame.home.name}</Text>
      </View>

      <Pressable onPress={() => setIsFieldExpanded(true)}>
        <View style={styles.fieldShell}>{renderField()}</View>
      </Pressable>

      <View style={styles.lineupSection}>
        <Text style={styles.lineupTitle}>Team rosters</Text>
        <View style={styles.lineupList}>
          {[selectedGame.away, selectedGame.home].map((team) => (
            <View key={team.abbreviation} style={styles.teamRoster}>
              <View style={styles.teamRosterHeader}>
                <View
                  style={[
                    styles.teamColorMark,
                    { backgroundColor: team.color },
                  ]}
                />
                <Text style={styles.teamRosterName}>{team.name}</Text>
                <Text style={styles.teamRosterRole}>{team.role}</Text>
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
                      style={styles.playerRow}
                      onPress={() => setSelectedPlayer(player)}
                    >
                      <View
                        style={[
                          styles.jerseyDot,
                          { backgroundColor: player.color },
                        ]}
                      />
                      <Text style={styles.playerName}>{player.name}</Text>
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
            <Text style={styles.modalTitle}>
              {selectedPlayer?.name ?? "Player"}
            </Text>
            <Text style={styles.modalPosition}>
              {selectedPlayer?.position ?? "Position"}
            </Text>
            <Text style={styles.modalJersey}>
              #{selectedPlayer?.jersey ?? "00"}
            </Text>
            <Text style={styles.modalInfo}>
              {selectedPlayer?.info ?? "Player information unavailable."}
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
  },
  gameTeamText: {
    color: "#f5f7fb",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
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
  lineupSection: {
    marginTop: 16,
  },
  lineupTitle: {
    color: "#f5f7fb",
    fontSize: 18,
    fontWeight: "700",
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
