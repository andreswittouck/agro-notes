export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Agro Notes (Front)</h1>
      <ul>
        <li>
          <a href="/voice-note">Nueva nota por voz →</a>
        </li>
        <li>
          <a href="/notes">Ver notas →</a>
        </li>
      </ul>
    </main>
  );
}
