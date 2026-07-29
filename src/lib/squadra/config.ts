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
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/** True se la bacheca di squadra e' stata configurata. */
export function squadraConfigurata(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}
