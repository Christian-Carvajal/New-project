export default function Scoreboard({ meId, players, scoreboard }) {
  return (
    <section className="panel sidebar-panel">
      <div className="section-header compact">
        <div>
          <span className="eyebrow">Room Score</span>
          <h2>Session standings</h2>
        </div>
        <span className="status-pill">Updates live</span>
      </div>

      <div className="score-list">
        {scoreboard.map((entry, index) => {
          const player = players.find((item) => item.id === entry.playerId);
          const descriptor = [
            entry.playerId === meId ? "You" : null,
            player?.isHost ? "Host" : null,
            player?.connected ? "In room" : "Reconnecting"
          ]
            .filter(Boolean)
            .join(" | ");

          return (
            <div className={`score-row ${entry.playerId === meId ? "me" : ""}`} key={entry.playerId}>
              <div className="score-rank" aria-hidden="true">
                {index + 1}
              </div>
              <div className="score-copy">
                <strong>{entry.username}</strong>
                <span>{descriptor}</span>
              </div>
              <div className="score-badge">{entry.score}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
