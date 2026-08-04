/**
 * Segnaposto della League. I dettagli non sono ancora decisi: qui c'e' solo
 * il posto in cui andra', cosi' la voce nella barra non si spostera' piu'.
 */
export function LeaguePage() {
  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Squadra</p>
          <h2>League</h2>
        </div>
      </div>

      <div className="vuoto league-attesa">
        <span className="league-icona">🏆</span>
        <p className="league-presto">Coming soon</p>
      </div>
    </section>
  );
}
