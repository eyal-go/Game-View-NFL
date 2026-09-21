import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
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
  players: Player[];
};

type Game = {
  id: string;
  status: string;
  away: TeamInfo;
  home: TeamInfo;
};

const FIELD_WIDTH = 1200;
const FIELD_HEIGHT = 600;

const demoGames: Game[] = [
  {
    id: "demo-1",
    status: "Live • Q2 • 03:14",
    away: {
      name: "Buffalo Bills",
      abbreviation: "BUF",
      color: "#0C2340",
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
          info: "High-impact tight end known for contested catches and playmaking.",
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

    return events.slice(0, 3).map((event: any) => {
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

      const formatTeam = (team: any, fallback: TeamInfo): TeamInfo => ({
        name: team?.displayName ?? fallback.name,
        abbreviation: team?.abbreviation ?? fallback.abbreviation,
        color: team?.color ? `#${team.color}` : fallback.color,
        players: fallback.players,
      });

      return {
        id: event.id,
        status,
        away: formatTeam(awayTeam, demoGames[0].away),
        home: formatTeam(homeTeam, demoGames[0].home),
      };
    });
  } catch (error) {
    return demoGames;
  }
};

export default function FieldScreen() {
  const [games, setGames] = useState<Game[]>(demoGames);
  const [selectedGameId, setSelectedGameId] = useState<string>(demoGames[0].id);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
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

  return (
    <View style={styles.container}>
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
            <Text style={styles.gameChipText}>
              {game.away.abbreviation} vs {game.home.abbreviation}
            </Text>
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
        <View style={styles.fieldShell}>
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

            {selectedGame.away.players.map((player) => (
              <G key={player.id} onPress={() => setSelectedPlayer(player)}>
                <Circle
                  cx={player.x}
                  cy={player.y}
                  r={18}
                  fill={player.color}
                  stroke="white"
                  strokeWidth="2"
                />
                <SvgText
                  x={player.x}
                  y={player.y + 6}
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  transform={`rotate(90 ${player.x} ${player.y})`}
                >
                  {player.position}
                </SvgText>
              </G>
            ))}

            {selectedGame.home.players.map((player) => (
              <G key={player.id} onPress={() => setSelectedPlayer(player)}>
                <Circle
                  cx={player.x}
                  cy={player.y}
                  r={18}
                  fill={player.color}
                  stroke="white"
                  strokeWidth="2"
                />
                <SvgText
                  x={player.x}
                  y={player.y + 6}
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  transform={`rotate(90 ${player.x} ${player.y})`}
                >
                  {player.position}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>
      </Pressable>

      <View style={styles.lineupContainer}>
        <Text style={styles.lineupTitle}>Current lineup</Text>
        <ScrollView
          style={styles.lineupScroll}
          contentContainerStyle={styles.lineupList}
          showsVerticalScrollIndicator={false}
        >
          {[...selectedGame.away.players, ...selectedGame.home.players].map(
            (player) => (
              <Pressable
                key={player.id}
                style={styles.playerRow}
                onPress={() => setSelectedPlayer(player)}
              >
                <View
                  style={[styles.jerseyDot, { backgroundColor: player.color }]}
                />
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
              </Pressable>
            ),
          )}
        </ScrollView>
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
        visible={isFieldExpanded}
        onRequestClose={() => setIsFieldExpanded(false)}
      >
        <Pressable
          style={styles.expandedFieldBackdrop}
          onPress={() => setIsFieldExpanded(false)}
        >
          <View style={styles.expandedFieldCard}>
            <View style={styles.expandedFieldShell}>
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
                      key={`expanded-yard-${index}`}
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

                {selectedGame.away.players.map((player) => (
                  <G key={player.id} onPress={() => setSelectedPlayer(player)}>
                    <Circle
                      cx={player.x}
                      cy={player.y}
                      r={18}
                      fill={player.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <SvgText
                      x={player.x}
                      y={player.y + 6}
                      fill="white"
                      fontSize="14"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(90 ${player.x} ${player.y})`}
                    >
                      {player.position}
                    </SvgText>
                  </G>
                ))}

                {selectedGame.home.players.map((player) => (
                  <G key={player.id} onPress={() => setSelectedPlayer(player)}>
                    <Circle
                      cx={player.x}
                      cy={player.y}
                      r={18}
                      fill={player.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <SvgText
                      x={player.x}
                      y={player.y + 6}
                      fill="white"
                      fontSize="14"
                      fontWeight="700"
                      textAnchor="middle"
                      transform={`rotate(90 ${player.x} ${player.y})`}
                    >
                      {player.position}
                    </SvgText>
                  </G>
                ))}
              </Svg>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10151d",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
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
    maxHeight: 76,
    marginBottom: 8,
  },
  gameChip: {
    backgroundColor: "#1a2532",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    minWidth: 150,
    borderWidth: 1,
    borderColor: "#2d3d4d",
  },
  gameChipActive: {
    borderColor: "#7cc4ff",
    backgroundColor: "#13283f",
  },
  gameChipText: {
    color: "#f5f7fb",
    fontSize: 14,
    fontWeight: "700",
  },
  gameChipSub: {
    color: "#9fb3c8",
    fontSize: 11,
    marginTop: 4,
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
  lineupContainer: {
    marginTop: 16,
    backgroundColor: "#0d1722",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#213244",
    maxHeight: 220,
  },
  lineupTitle: {
    color: "#f5f7fb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  lineupScroll: {
    maxHeight: 170,
  },
  lineupList: {
    gap: 8,
    paddingBottom: 6,
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
    backgroundColor: "#000000",
    padding: 0,
    margin: 0,
  },
  expandedFieldCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  expandedFieldShell: {
    flex: 1,
    backgroundColor: "#1d2c22",
    transform: [{ rotate: "90deg" }],
    width: "100%",
    height: "100%",
  },
});
