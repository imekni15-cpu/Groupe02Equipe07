import { http, USE_MOCK } from '../api/http'
import * as db from '../api/mockDb'

export const offerService = {
  // GET /offers : offres des commerces `approved`, `quantity` = stock restant (proposition, vue étudiant)
  list: async () => (USE_MOCK ? db.listOffers() : (await http.get('/offers')).data),
}
