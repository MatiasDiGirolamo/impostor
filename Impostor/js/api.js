// Capa de API: obtener jugadores de randomuser.me
export async function fetchRandomPlayers(count) {
  const res = await fetch(`https://randomuser.me/api/?results=${count}&nat=es,gb,us,br,fr,it`);
  const data = await res.json();
  return data.results.map(r => {
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    return `${cap(r.name.first)} ${cap(r.name.last)}`;
  });
}
