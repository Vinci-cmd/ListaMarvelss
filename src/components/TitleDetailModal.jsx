import React, { useEffect } from 'react';
import { X, Layers, Sparkles, Star, Calendar, Compass, Clock } from 'lucide-react';
import PosterEmblem from './PosterEmblem';

export default function TitleDetailModal({
  item,
  userItem,
  onClose,
  onSetStatus,
  onSetRating,
  onUpdateNotes
}) {
  useEffect(() => {
    if (!item) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const status = userItem?.status || 'unwatched';
  const rating = userItem?.rating || 0;
  const notes = userItem?.notes || '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="modal-reveal bg-[#111118] border border-white/15 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale Cinematografico */}
        <div className={`relative p-6 sm:p-8 bg-gradient-to-br ${item.gradient} overflow-hidden`}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,8,12,0.22) 0%, rgba(8,8,12,0.82) 100%)'
            }}
          />
          <PosterEmblem type={item.iconType} className="w-52 h-52 opacity-20 absolute -right-6 -bottom-6 text-white" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi dettagli"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 text-xs font-bold text-white border border-white/15">
                {item.universe}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/70 text-xs font-bold text-zinc-200 border border-white/15">
                {item.phase}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/70 text-xs font-semibold text-[#f3c66c] border border-[#e5a93b]/30">
                {item.saga}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#e62429] text-xs font-bold text-white">
                {item.type}
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-none">
              {item.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5">
              Titolo originale: <span className="italic text-white">{item.originalTitle}</span>
            </p>
          </div>
        </div>

        {/* Corpo Dettagli */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Griglia Metadati Chiave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
            <div className="p-3 rounded-xl bg-black/45 border border-white/10">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                <span>Uscita</span>
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">{item.releaseDate}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/45 border border-white/10">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#e5a93b]" />
                <span>Timeline</span>
              </div>
              <div className="text-sm font-bold text-[#f3c66c] mt-1">{item.timelineYear}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/45 border border-white/10">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Durata</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">{item.durationLabel}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/45 border border-white/10">
              <div className="text-[11px] text-zinc-400">Essenzialità</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  item.essentiality === 'Essenziale'
                    ? 'text-[#f3c66c]'
                    : item.essentiality === 'Consigliato'
                    ? 'text-emerald-400'
                    : 'text-sky-400'
                }`}
              >
                {item.essentiality}
              </div>
            </div>
          </div>

          {/* Sinossi */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Trama & Sinossi
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed">{item.synopsis}</p>
          </div>

          {/* Box Connessioni Multiverso */}
          {item.multiverseConnection && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/12">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4 text-[#e5a93b]" />
                <span>Connessioni Multiverso & Cameo MCU</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {item.multiverseConnection}
              </p>
            </div>
          )}

          {/* Box Scene Post-Credit */}
          <div className="p-4 rounded-xl bg-[#e5a93b]/[0.08] border border-[#e5a93b]/30">
            <div className="flex items-center gap-2 text-[#f3c66c] font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Guida Scene Post-Credit ({item.postCreditsCount}) • Senza Spoiler</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              {item.postCreditsHint}
            </p>
          </div>

          {/* Cast e Personaggi Principali */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Cast Principale & Personaggi Chiave
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.characters.map((char) => (
                <span
                  key={char}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-medium text-zinc-200"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Sezione Tracciamento */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Stato Visione
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'unwatched', label: 'Da Vedere' },
                    { id: 'in_progress', label: 'In Corso' },
                    { id: 'watched', label: 'Completato' }
                  ].map((st) => {
                    const active = status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSetStatus(item.id, st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          active
                            ? 'bg-[#e62429] text-white border-red-400'
                            : 'bg-black/45 text-zinc-300 border-white/10 hover:text-white hover:border-white/25'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Valutazione (1-5)
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Valuta ${star} stelle`}
                      onClick={(e) => onSetRating(item.id, star === rating ? 0 : star, e)}
                      className="p-1 text-zinc-600 hover:text-[#e5a93b] transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-[#e5a93b] text-[#e5a93b]' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Note & Commenti
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                placeholder="Scrivi un appunto su questo film/serie, teorie sul multiverso o commenti dopo la visione..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/55 border border-white/12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
