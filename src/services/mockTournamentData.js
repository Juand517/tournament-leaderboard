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

function generateParticipants(count) {
  const participants = [];
  for (let i = 1; i <= count; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const prefix = usernamePrefixes[Math.floor(Math.random() * usernamePrefixes.length)];
    const suffix = usernameSuffixes[Math.floor(Math.random() * usernameSuffixes.length)];

    participants.push(
      {
        id: i,
        username: `${prefix}_${suffix}_${i}`,
        country: country.code,
        countryName: country.name,
        score: Math.max(1000, 20000 - (i * 300) + Math.random() * 500),
        rank: i
      }
    );
  }
  return participants;
}

export default generateParticipants;