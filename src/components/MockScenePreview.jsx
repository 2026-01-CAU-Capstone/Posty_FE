import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';

const imageProfiles = {
  'seongsu-window': {
    username: 'seongsu.daily',
    location: '성수동, 서울',
    likes: '1,284',
    timeAgo: '3시간 전',
    storyGradient: 'from-[#F58529] via-[#DD2A7B] to-[#515BD4]',
  },
  'editorial-rack': {
    username: 'hn_showroom',
    location: '한남동 쇼룸',
    likes: '2,107',
    timeAgo: '1일 전',
    storyGradient: 'from-[#833AB4] via-[#FD1D1D] to-[#FCB045]',
  },
  'beauty-counter': {
    username: 'cd_beauty_lab',
    location: '청담동, 서울',
    likes: '891',
    timeAgo: '5시간 전',
    storyGradient: 'from-[#405DE6] via-[#5851DB] to-[#833AB4]',
  },
};

export function MockScenePreview({
  image,
  accent,
  filterStyle = 'none',
  overlayText = '없음',
  compact = false,
  caption,
  uploadedImageUrl,
}) {
  const profile = imageProfiles[image.id] ?? {
    username: 'brand_account',
    location: '서울',
    likes: '1,024',
    timeAgo: '방금 전',
    storyGradient: 'from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  };

  const previewCaption = caption ?? image.subject;
  const aspectClass = compact ? 'aspect-square' : 'aspect-[4/5]';
  const photoUrl = uploadedImageUrl ?? image.src ?? null;
  const hasRealPhoto = Boolean(photoUrl);
  const objectPosition = 'center';

  return (
    <div className="overflow-hidden rounded-[20px] border border-[rgba(219,219,219,0.65)] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Story ring */}
          <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${profile.storyGradient} p-[2px]`}>
            <div className="h-full w-full rounded-full bg-white p-[1.5px]">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                  style={{ objectPosition }}
                />
              ) : (
                <div className="h-full w-full rounded-full" style={{ background: image.background }} />
              )}
            </div>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold leading-tight text-[#262626]">{profile.username}</p>
            <p className="text-[11px] leading-tight text-[#737373]">{profile.location}</p>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#262626]" />
      </div>

      {/* Image / content area */}
      <div
        className={`relative overflow-hidden ${aspectClass}`}
        style={hasRealPhoto ? {} : { background: image.background, filter: filterStyle }}
      >
        {hasRealPhoto ? (
          /* Real uploaded photo or sample crop */
          <img
            src={photoUrl}
            alt="업로드된 사진"
            className="h-full w-full object-cover"
            style={{
              objectPosition,
              filter: filterStyle !== 'none' ? filterStyle : undefined,
            }}
          />
        ) : (
          /* Gradient placeholder */
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 22% 18%, ${image.glowA} 0%, transparent 42%),
                  radial-gradient(circle at 76% 22%, ${image.glowB} 0%, transparent 34%),
                  linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,15,20,0.18) 100%)
                `,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[72%] h-[68%]">
                <div
                  className="absolute inset-0 rounded-[18px] border border-white/30"
                  style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(2px)' }}
                />
                <div className="absolute -top-6 right-4 h-16 w-16 rounded-[14px] border border-white/35 bg-white/20 backdrop-blur-sm" />
                <div
                  className="absolute bottom-4 left-4 h-10 w-10 rounded-full shadow-lg"
                  style={{ background: accent, opacity: 0.85 }}
                />
              </div>
            </div>
          </>
        )}

        {/* Style overlay tag */}
        {overlayText !== '없음' && (
          <div
            className="absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-md"
            style={{ background: accent }}
          >
            {overlayText}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pt-2.5 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-[22px] w-[22px] text-[#262626] hover:text-red-500 transition-colors cursor-pointer" />
            <MessageCircle className="h-[22px] w-[22px] text-[#262626] cursor-pointer" />
            <Send className="h-[22px] w-[22px] text-[#262626] cursor-pointer" />
          </div>
          <Bookmark className="h-[22px] w-[22px] text-[#262626] cursor-pointer" />
        </div>
        <p className="text-[12.5px] font-semibold text-[#262626]">좋아요 {profile.likes}개</p>
        <p className="text-[12.5px] text-[#262626] line-clamp-2 leading-5">
          <span className="font-semibold">{profile.username}</span>{' '}
          <span className="text-[#262626]">{previewCaption}</span>
        </p>
        <p className="text-[11px] text-[#8E8E8E]">{profile.timeAgo}</p>
      </div>
    </div>
  );
}
