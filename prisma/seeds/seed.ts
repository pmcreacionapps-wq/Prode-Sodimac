import { PrismaClient, MatchPhase, MatchStatus } from "@prisma/client"

const prisma = new PrismaClient()

const TEAMS = [
  { name: "Argentina", code: "ARG", flagUrl: "https://flagcdn.com/w80/ar.png", group: "A" },
  { name: "Brasil", code: "BRA", flagUrl: "https://flagcdn.com/w80/br.png", group: "A" },
  { name: "Francia", code: "FRA", flagUrl: "https://flagcdn.com/w80/fr.png", group: "B" },
  { name: "España", code: "ESP", flagUrl: "https://flagcdn.com/w80/es.png", group: "B" },
  { name: "Alemania", code: "GER", flagUrl: "https://flagcdn.com/w80/de.png", group: "C" },
  { name: "Portugal", code: "POR", flagUrl: "https://flagcdn.com/w80/pt.png", group: "C" },
  { name: "Inglaterra", code: "ENG", flagUrl: "https://flagcdn.com/w80/gb-eng.png", group: "D" },
  { name: "Países Bajos", code: "NED", flagUrl: "https://flagcdn.com/w80/nl.png", group: "D" },
  { name: "Uruguay", code: "URU", flagUrl: "https://flagcdn.com/w80/uy.png", group: "E" },
  { name: "Colombia", code: "COL", flagUrl: "https://flagcdn.com/w80/co.png", group: "E" },
  { name: "México", code: "MEX", flagUrl: "https://flagcdn.com/w80/mx.png", group: "F" },
  { name: "Estados Unidos", code: "USA", flagUrl: "https://flagcdn.com/w80/us.png", group: "F" },
  { name: "Marruecos", code: "MAR", flagUrl: "https://flagcdn.com/w80/ma.png", group: "G" },
  { name: "Senegal", code: "SEN", flagUrl: "https://flagcdn.com/w80/sn.png", group: "G" },
  { name: "Japón", code: "JPN", flagUrl: "https://flagcdn.com/w80/jp.png", group: "H" },
  { name: "Corea del Sur", code: "KOR", flagUrl: "https://flagcdn.com/w80/kr.png", group: "H" },
]

const FAKE_USERS = [
  { nickname: "messi_fan10", displayName: "Messi Fan", totalPoints: 48, streak: 5 },
  { nickname: "mundial2026", displayName: "Mundial 2026", totalPoints: 39, streak: 3 },
  { nickname: "profe_carlos", displayName: "Profe Carlos", totalPoints: 35, streak: 2 },
  { nickname: "ana_goles", displayName: "Ana", totalPoints: 31, streak: 1 },
  { nickname: "torino_fc", displayName: "Torino", totalPoints: 27, streak: 0 },
  { nickname: "english_next", displayName: "Next Student", totalPoints: 22, streak: 0 },
]

async function main() {
  console.log("🌱 Seeding database...")

  // Admin settings singleton
  await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      registrationOpen: true,
      predictionsEnabled: true,
      maxParticipants: 0,
    },
  })

  // Teams
  const teamMap: Record<string, string> = {}
  for (const team of TEAMS) {
    const t = await prisma.team.upsert({
      where: { code: team.code },
      update: team,
      create: { ...team, apiId: Math.floor(Math.random() * 9000 + 1000) },
    })
    teamMap[team.code] = t.id
  }
  console.log(`✅ ${TEAMS.length} teams upserted`)

  // Fixtures — group stage matches (12 June 2026 onwards)
  const groupMatches = [
    { home: "ARG", away: "BRA", kickoff: new Date("2026-06-12T18:00:00Z"), group: "A" },
    { home: "FRA", away: "ESP", kickoff: new Date("2026-06-12T21:00:00Z"), group: "B" },
    { home: "GER", away: "POR", kickoff: new Date("2026-06-13T18:00:00Z"), group: "C" },
    { home: "ENG", away: "NED", kickoff: new Date("2026-06-13T21:00:00Z"), group: "D" },
    { home: "URU", away: "COL", kickoff: new Date("2026-06-14T18:00:00Z"), group: "E" },
    { home: "MEX", away: "USA", kickoff: new Date("2026-06-14T21:00:00Z"), group: "F" },
    { home: "MAR", away: "SEN", kickoff: new Date("2026-06-15T18:00:00Z"), group: "G" },
    { home: "JPN", away: "KOR", kickoff: new Date("2026-06-15T21:00:00Z"), group: "H" },
  ]

  for (const m of groupMatches) {
    await prisma.match.upsert({
      where: { apiId: parseInt(`${teamMap[m.home].slice(-4)}${teamMap[m.away].slice(-4)}`, 16) % 99999 + 1 },
      update: {},
      create: {
        apiId: parseInt(`${teamMap[m.home].slice(-4)}${teamMap[m.away].slice(-4)}`, 16) % 99999 + 1,
        homeTeamId: teamMap[m.home],
        awayTeamId: teamMap[m.away],
        kickoffAt: m.kickoff,
        phase: MatchPhase.GROUP,
        status: MatchStatus.SCHEDULED,
        groupName: m.group,
        venue: "TBD",
        city: "TBD",
      },
    })
  }
  console.log(`✅ ${groupMatches.length} fixtures created`)

  console.log("✅ Seed complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
