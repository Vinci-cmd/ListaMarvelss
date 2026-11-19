import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Film,
  Tv,
  Sparkles,
  Calendar,
  Compass,
  Star,
  MessageSquareText,
  Layers
} from 'lucide-react';
import PosterEmblem from './PosterEmblem';

export default function TitleCard({
  item,
  index,
  userItem,
  sortMode,
  onSelect,
  onToggleWatched,
  onSetRating
}) {
  const isWatched = userItem.status === 'watched';
  const isInProgress = userItem.status === 'in_progress';
  const hasNotes = Boolean(userItem.notes && userItem.notes.trim().length > 0);
  const formattedIndex = String(index + 1).padStart(3, '0');

  return (
    <article
      onClick={() => onSelect(item)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={`poster-card group relative rounded-[14px] overflow-hidden border cursor-pointer flex flex-col justify-between bg-[#111118] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
        isWatched
          ? 'border-emerald-500/40 hover:border-emerald-400/70'
          : isInProgress
          ? 'border-amber-500/50 hover:border-amber-400/80'
          : 'border-white/10 hover:border-[#e62429]/70'
      }`}
    >
      {/* Poster Header Cinematografico */}
      <div className={`relative h-48 bg-gradient-to-br ${item.gradient} p-4 flex flex-col justify-between overflow-hidden`}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,8,12,0.28) 0%, rgba(8,8,12,0.12) 42%, rgba(8,8,12,0.88) 100%)'
          }}
        />
        <div
          className="poster-sheen absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.14), transparent 55%)'
          }}
        />
        <div className="poster-emblem absolute -right-4 -bottom-4 text-white opacity-20 pointer-events-none">
          <PosterEmblem type={item.iconType} className="w-32 h-32" />
        </div>

        {/* Riga Superiore: Numero d'archivio + Fase + Formato */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[11px] font-mono font-bold text-[#e5a93b] border border-white/12 tabular-nums shrink-0">
              #{formattedIndex}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-sm text-[11px] font-semibold text-zinc-100 border border-white/12 truncate max-w-[125px]">
              {item.phase}
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-zinc-200 border border-white/15 flex items-center gap-1 shrink-0">
            {item.type === 'Film' ? (
              <Film className="w-3 h-3 text-[#e62429]" />
            ) : item.type === 'Serie TV' ? (
              <Tv className="w-3 h-3 text-sky-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#e5a93b]" />
            )}
            {item.type === 'Special Presentation' ? 'Special' : item.type}
          </span>
        </div>

        {/* Titolo Display & Tag Universo */}
        <div className="relative z-10 mt-auto">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/55 text-zinc-200 border border-white/10">
              {item.universe || 'MCU (Fasi 1-6)'}
            </span>
            {item.essentiality === 'Essenziale' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e5a93b]/20 text-[#f3c66c] border border-[#e5a93b]/40">
                Essenziale
              </span>
            )}
            {hasNotes && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-sky-300 border border-sky-400/35 flex items-center"
                title="Contiene note"
              >
                <MessageSquareText className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white leading-[1.05] group-hover:text-[#f3c66c] transition-colors line-clamp-2">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Corpo Card */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 gap-2 tabular-nums">
            {sortMode === 'timeline' ? (
              <span className="flex items-center gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 text-[#e5a93b] shrink-0" />
                <span>
                  Timeline: <strong className="text-[#f3c66c] font-semibold">{item.timelineYear}</strong>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>
                  Uscita: <strong className="text-zinc-200 font-semibold">{item.releaseYear}</strong>
                </span>
              </span>
            )}
            <span className="flex items-center gap-1 shrink-0 font-mono text-[11px] text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {item.durationLabel}
            </span>
          </div>

          <p className="text-[13px] text-zinc-300 line-clamp-2 leading-relaxed mb-2.5">
            {item.synopsis}
          </p>

          {item.multiverseConnection && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-200/90 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg px-2.5 py-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-[#e5a93b] shrink-0" />
              <span className="line-clamp-1 font-medium">{item.multiverseConnection}</span>
            </div>
          )}

          {/* Personaggi principali */}
          <div className="flex flex-wrap gap-1">
            {item.characters.slice(0, 3).map((char) => (
              <span
                key={char}
                className="text-[11px] bg-white/[0.04] border border-white/[0.07] text-zinc-300 px-2 py-0.5 rounded-md truncate max-w-[130px]"
              >
                {char.split(' / ')[0]}
              </span>
            ))}
            {item.characters.length > 3 && (
              <span className="text-[11px] text-zinc-400 px-1 py-0.5 tabular-nums">
                +{item.characters.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer Interattivo Card */}
        <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#e5a93b] flex items-center gap-1 tabular-nums">
              <Sparkles className="w-3.5 h-3.5" />
              {item.postCreditsCount > 0 ? `${item.postCreditsCount} Post-Credit` : 'No Post-Credit'}
            </span>

            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Valuta ${star} stelle`}
                  onClick={(e) => onSetRating(item.id, star === userItem.rating ? 0 : star, e)}
                  className="p-0.5 text-zinc-600 hover:text-[#e5a93b] transition-colors"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      star <= (userItem.rating || 0) ? 'fill-[#e5a93b] text-[#e5a93b]' : ''
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleWatched(item.id, e)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isWatched
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : isInProgress
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/[0.05] hover:bg-white/[0.11] text-zinc-100 border border-white/10'
            }`}
          >
            {isWatched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Visto</span>
              </>
            ) : isInProgress ? (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>In Corso</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-zinc-400" />
                <span>Segna Visto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
