const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" },
  { code: "DE", name: "Germany" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
  { code: "BR", name: "Brazil" },
  { code: "IT", name: "Italy" }
];

const usernamePrefixes = ["trader", "forex", "crypto", "pro", "ninja", "master"];
const usernameSuffixes = ["king", "queen", "ace", "star", "legend", "pro"];

const avatars = [
  require("@/assets/avatars/avatar1.png"),
  require("@/assets/avatars/avatar2.png"),
  require("@/assets/avatars/avatar3.png"),
  require("@/assets/avatars/avatar4.png"),
];

function generateParticipants(count) {
  const participants = [];
  for (let i = 1; i <= count; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const prefix = usernamePrefixes[Math.floor(Math.random() * usernamePrefixes.length)];
    const suffix = usernameSuffixes[Math.floor(Math.random() * usernameSuffixes.length)];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    participants.push(
      {
        id: i,
        username: `${prefix}_${suffix}_${i}`,
        country: country.code,
        countryName: country.name,
        score: Math.max(1000, 20000 - (i * 300) + Math.random() * 200),
        rank: i,
        avatar
      }
    );
  }
  return participants;
}

export default generateParticipants;