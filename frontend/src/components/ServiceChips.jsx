import { resolveMediaUrl } from '../lib/media.js';

function ServiceChips({ details, showFileLink = false }) {
  if (!details) {
    return null;
  }

  const chips = [
    details.printType,
    details.paperSize,
    details.colorMode,
    details.printSide,
    details.finish,
    details.fileName,
  ].filter(Boolean);

  if (!chips.length && !(showFileLink && details.fileUrl)) {
    return null;
  }

  return (
    <div className="drawer-item__details">
      {chips.map((label) => (
        <span key={label}>{label}</span>
      ))}
      {showFileLink && details.fileUrl ? (
        <a className="file-chip" href={resolveMediaUrl(details.fileUrl)} rel="noreferrer" target="_blank">
          Open file
        </a>
      ) : null}
    </div>
  );
}

export default ServiceChips;
