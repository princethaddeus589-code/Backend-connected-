import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildHtml } from "./lib";
import { apiPublic } from "./plan";

export default function Public() {
  const { slug } = useParams();
  const [s, setS] = useState({ loading: true });

  useEffect(() => {
    document.title = "Portfolio";
    apiPublic(slug)
      .then((r) => {
        document.title = `${r.data?.name || "Portfolio"}${r.data?.title ? " | " + r.data.title : ""}`;
        setS({ data: r.data, branding: r.branding });
      })
      .catch((e) => setS({ error: e.message }));
  }, [slug]);

  if (s.loading) return <div className="notfound"><p className="muted">Loading portfolio...</p></div>;
  if (s.error) {
    return (
      <div className="notfound">
        <h1>Portfolio not found</h1>
        <p className="muted">{s.error}</p>
        <Link to="/" className="btn">Create your own portfolio</Link>
      </div>
    );
  }
  let html = buildHtml(s.data);
  if (!s.branding) html = html.split(" Built with Portfolia.").join("");
  return (
    <div className="viewer">
      <iframe title={s.data?.name || "Portfolio"} srcDoc={html} sandbox="allow-popups allow-popups-to-escape-sandbox" />
      {s.branding && <a className="badge" href="/" target="_blank" rel="noopener">Made with Portfolia</a>}
    </div>
  );
}
