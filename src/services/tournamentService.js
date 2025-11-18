import generateParticipants from './mockTournamentData.js'

class TournamentService {
    constructor() {
       // Creamos los 50 participantes iniciales
      this.participants = generateParticipants(50); 
      console.log('Participants generated:', this.participants.length);

    }

  // Get paginated leaderboard
  async getLeaderboard(pageableParams) {
    await this.simulateDelay();
    // Return: { content: [], totalElements: X, totalPages: X, number: X, size: X }

    

    // Optionally simulate errors
    if (this.SimulateError()) {
      throw new Error('Failed to fetch leaderboard');
    }
    const size =  pageableParams.size;
    const page = pageableParams.page;

    const sortField = pageableParams.sort?.value || "rank";
    const sortOrder = pageableParams.sort?.order || "asc";

    // 1. Ordenar los participantes antes de paginar
    const sortedParticipants = [...this.participants].sort((participant1, participant2) => {
      const value1 = participant1[sortField];
      const value2 = participant2[sortField];

      if (value1 < value2) return sortOrder === "asc" ? -1 : 1;
      if (value1 > value2) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Calculate pagination
    const start = page *size;
    const end = start + size;
    const content = sortedParticipants.slice(start, end);

    return {
      content,
      totalElements: this.participants.length,
      totalPages: Math.ceil(this.participants.length / size),
      number: page,
      size: size
    };
  }
  

  // Get filtered leaderboard
  async getFilteredLeaderboard(filters = {}, pageableParams) {
        await this.simulateDelay();

    const { username = '', country = '' } = filters;

    // Filtrado básico
    let filtered = [...this.participants];

    if (username) {
      filtered = filtered.filter((p) =>
        p.username.toLowerCase().startsWith(username.toLowerCase())
      );
    }

    if (country) {
      filtered = filtered.filter((p) => p.country === country);
    }

    // Ordenamos y paginamos reutilizando getLeaderboard
    const serviceCopy = new TournamentService();
    serviceCopy.participants = filtered;

    return serviceCopy.getLeaderboard(pageableParams);



    
    // Apply filters (username partial match, country exact match)
    // Simulate API delay
    // Return same format as getLeaderboard
  }

  // Get available countries
  async getCountries() {

 // Simula un retardo como si fuera una llamada API real
  await this.simulateDelay();

  // Usamos un Set para evitar duplicados
  const seen = new Set();
  const countries = [];

  for (const participant of this.participants) {
    if (!seen.has(participant.country)) {
      seen.add(participant.country);
      countries.push({
        code: participant.country,
        name: participant.countryName,
      });
    }
  }

  // Ordenamos alfabéticamente por nombre
  countries.sort((a, b) => a.name.localeCompare(b.name));

  return countries;
  }

  simulateDelay() {
    const delay = Math.random() * 500 + 300; // 300-800ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  SimulateError() {
    return Math.random() < 0.1; // 10% chance of error
  }

}
export default new TournamentService();
