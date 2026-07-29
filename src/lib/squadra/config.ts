/**
 * Configurazione Firebase della bacheca di squadra.
 *
 * Queste chiavi sono pubbliche per progetto: identificano il progetto, non
 * autorizzano nulla. La protezione dei dati si fa con le regole di Firestore
 * (vedi firestore.rules), non nascondendo questi valori.
 *
 * Finche' i campi restano vuoti la funzione "Squadra" resta disattivata e il
 * resto dell'app funziona normalmente.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDD2DRjf8rd8Yo8dbUjwA0WNu7-3XLum7E",
  authDomain: "darts-trainer-chemicals.firebaseapp.com",
  projectId: "darts-trainer-chemicals",
  storageBucket: "darts-trainer-chemicals.firebasestorage.app",
  messagingSenderId: "775835556109",
  appId: "1:775835556109:web:14c4d608967d3bf9867844",
};

/** True se la bacheca di squadra e' stata configurata. */
export function squadraConfigurata(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}
