import { useState } from "react";
import { Icon } from "./ui";

export default function ShareModal({ url, name, title = "Share your portfolio", onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Check out ${name ? name + "'s" : "my"} portfolio`;
  const enc = encodeURIComponent;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy your link:", url);
    }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: name || "My portfolio", text, url }); } catch { /* cancelled */ }
    } else copy();
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="x close" onClick={onClose} aria-label="Close"><Icon n="x" s={18} /></button>
        <span className="fic"><Icon n="check" /></span>
        <h2>{title}</h2>
        <p className="muted">Anyone with this link can see your portfolio.</p>
        <div className="linkbox">{url}</div>
        <div className="share-row">
          <button className="btn" onClick={copy}><Icon n={copied ? "check" : "copy"} s={18} /> {copied ? "Copied" : "Copy link"}</button>
          <button className="btn ghost" onClick={share}><Icon n="share" s={18} /> Share</button>
        </div>
        <div className="share-apps">
          <a href={`https://wa.me/?text=${enc(text + " " + url)}`} target="_blank" rel="noopener">WhatsApp</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener">LinkedIn</a>
          <a href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noopener">X</a>
          <a href={`mailto:?subject=${enc(text)}&body=${enc(url)}`}>Email</a>
          <a href={url} target="_blank" rel="noopener">Open</a>
        </div>
        <button className="btn ghost full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
