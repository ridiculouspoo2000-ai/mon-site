/*
 * Fourmi'Action · suppression quotidienne des dossiers d'autorisation non signés après 30 jours.
 * Fonction planifiée Netlify (une exécution par jour).
 */
import { purgeExpired } from "./droit-image.mjs";

export const config = { schedule: "@daily" };

export default async () => {
  try { const n = await purgeExpired(); console.log(`droit-image : ${n} dossier(s) expiré(s) supprimé(s)`); }
  catch (e) { console.error("droit-image purge", e); }
  return new Response("ok");
};
