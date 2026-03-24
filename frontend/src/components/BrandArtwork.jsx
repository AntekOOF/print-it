import { Camera, Cookie, FileText, MousePointerClick, Printer, Sparkles } from 'lucide-react';

function BrandArtwork({ compact = false }) {
  return (
    <div className={`brand-artwork${compact ? ' brand-artwork--compact' : ''}`}>
      <div className="brand-artwork__ring" />
      <div className="brand-artwork__ring brand-artwork__ring--inner" />

      <div className="brand-artwork__chip brand-artwork__chip--printer">
        <Printer size={compact ? 20 : 28} />
      </div>
      <div className="brand-artwork__chip brand-artwork__chip--document">
        <FileText size={compact ? 18 : 24} />
      </div>
      <div className="brand-artwork__chip brand-artwork__chip--cursor">
        <MousePointerClick size={compact ? 20 : 26} />
      </div>
      <div className="brand-artwork__chip brand-artwork__chip--snack">
        <Cookie size={compact ? 18 : 24} />
      </div>
      <div className="brand-artwork__chip brand-artwork__chip--camera">
        <Camera size={compact ? 18 : 24} />
      </div>

      <div className="brand-artwork__core">
        <span className="eyebrow">Quality Prints For A Cause</span>
        <h2>Print-IT</h2>
        <p>Campus-friendly snacks, custom prints, and real order tracking.</p>
        <div className="brand-artwork__spark">
          <Sparkles size={16} />
          <span>Built for fast school-day orders</span>
        </div>
      </div>
    </div>
  );
}

export default BrandArtwork;
