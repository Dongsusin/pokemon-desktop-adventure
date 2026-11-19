import type { FieldTrainer, FieldVenue } from './fieldTrainers'
import type { RegionId } from './world'

// Local map positions and encounter difficulty. Old keys identify returning opponents in v0.27 saves.
type Placement = readonly [sourceId: string, locationId: string, requiredBadges: number, highestLevel: number,
  venue: FieldVenue, kind: FieldTrainer['kind'], series: FieldTrainer['series'], existingKey?: string]

export const arenaPlacements: Readonly<Record<RegionId, readonly Placement[]>> = {
  kanto: [
    ['a-038', 'viridian-forest', 0, 5, 'forest', 'ally', 'anime', 'ash'], // 지우
    ['d-237', 'viridian-city', 0, 6, 'city', 'rival', 'anime'], // 고우
    ['d-238', 'route-1', 0, 6, 'route', 'ally', 'anime'], // 채하루
    ['c-105', 'pewter-city', 0, 7, 'city', 'trainer', 'game'], // 웅
    ['d-193', 'mt-moon', 1, 12, 'cave', 'villain', 'both', 'rocket-duo'], // 로사&로이
    ['c-106', 'cerulean-city', 1, 14, 'city', 'trainer', 'game'], // 이슬
    ['a-026', 'ss-anne', 2, 19, 'ship', 'rival', 'game', 'blue'], // 그린
    ['c-107', 'vermilion-city', 2, 20, 'city', 'trainer', 'game'], // 마티스
    ['b-040', 'pallet-town', 2, 21, 'city', 'ally', 'game'], // 오박사
    ['b-042', 'rock-tunnel', 2, 21, 'cave', 'trainer', 'game'], // 시바
    ['c-108', 'celadon-city', 3, 26, 'city', 'trainer', 'game'], // 민화
    ['b-043', 'pokemon-tower', 3, 27, 'ruins', 'trainer', 'game'], // 국화
    ['c-109', 'fuchsia-city', 4, 33, 'city', 'trainer', 'game'], // 도희
    ['c-110', 'saffron-city', 4, 33, 'city', 'trainer', 'game'], // 초련
    ['b-045', 'silph-co', 4, 39, 'hideout', 'villain', 'both', 'giovanni'], // 비주기
    ['b-041', 'seafoam-islands', 5, 39, 'cave', 'trainer', 'game'], // 칸나
    ['s-002', 'route-22', 5, 42, 'route', 'trainer', 'game'], // 태주
    ['s-003', 'sea-cottage', 5, 42, 'coast', 'trainer', 'game'], // 보연
    ['c-111', 'cinnabar-island', 6, 44, 'coast', 'trainer', 'game'], // 강연
    ['a-027', 'route-24', 6, 47, 'route', 'rival', 'game'], // 진우
    ['b-044', 'cerulean-cave', 8, 59, 'cave', 'trainer', 'game'], // 블루
    ['s-001', 'victory-road', 8, 62, 'cave', 'trainer', 'game'], // 레드
  ],
  johto: [
    ['d-194', 'cherrygrove-city', 0, 5, 'city', 'rival', 'game', 'silver'], // 실버
    ['c-112', 'violet-city', 0, 7, 'city', 'trainer', 'game'], // 비상
    ['c-113', 'azalea-town', 1, 14, 'city', 'trainer', 'game'], // 호일
    ['boss-proton-petrel', 'slowpoke-well', 1, 15, 'cave', 'villain', 'game'], // 랜스 / 란다
    ['c-114', 'goldenrod-city', 2, 20, 'city', 'trainer', 'game'], // 꼭두
    ['b-046', 'ruins-of-alph', 2, 21, 'ruins', 'trainer', 'game'], // 일목
    ['b-047', 'dark-cave', 2, 21, 'cave', 'trainer', 'game'], // 카렌
    ['c-115', 'ecruteak-city', 3, 26, 'city', 'trainer', 'game'], // 유진
    ['d-195', 'cianwood-city', 4, 25, 'coast', 'ally', 'game', 'eusine'], // 수호
    ['c-116', 'whirl-islands', 4, 33, 'cave', 'trainer', 'game'], // 사도
    ['c-117', 'olivine-lighthouse', 4, 33, 'coast', 'trainer', 'game'], // 규리
    ['s-004', 'new-bark-town', 5, 42, 'city', 'rival', 'game'], // 심향
    ['s-005', 'national-park', 5, 42, 'forest', 'rival', 'game'], // 금선
    ['boss-ariana-archer', 'mahogany-town', 6, 27, 'hideout', 'villain', 'game'], // 아테나 / 아폴로
    ['a-028', 'lake-of-rage', 6, 47, 'coast', 'trainer', 'game'], // 목호
    ['d-192', 'goldenrod-radio-tower', 7, 37, 'hideout', 'villain', 'game', 'archer'], // 아폴로
    ['c-118', 'ice-path', 7, 50, 'cave', 'trainer', 'game'], // 류옹
    ['c-119', 'dragons-den', 7, 50, 'cave', 'trainer', 'game'], // 이향
    ['b-048', 'johto-victory-road', 8, 59, 'cave', 'trainer', 'game'], // 독수
  ],
  hoenn: [
    ['s-007', 'route-103', 0, 5, 'route', 'rival', 'game', 'may'], // 봄이
    ['c-120', 'rustboro-city', 0, 7, 'city', 'trainer', 'game'], // 원규
    ['c-124', 'petalburg-city', 0, 7, 'city', 'trainer', 'game'], // 종길
    ['c-121', 'dewford-town', 1, 14, 'city', 'trainer', 'game'], // 철구
    ['b-049', 'mauville-city', 2, 15, 'city', 'rival', 'game', 'wally'], // 민진
    ['b-054', 'mt-chimney', 3, 25, 'volcano', 'villain', 'game', 'maxie'], // 마적
    ['c-123', 'lavaridge-town', 3, 26, 'city', 'trainer', 'game'], // 민지
    ['b-053', 'meteor-falls', 3, 27, 'cave', 'trainer', 'game'], // 권수
    ['c-122', 'new-mauville', 5, 38, 'cave', 'trainer', 'game'], // 암페어
    ['c-125', 'fortree-city', 5, 38, 'city', 'trainer', 'game'], // 은송
    ['b-056', 'abandoned-ship', 5, 39, 'ship', 'trainer', 'game'], // 기선
    ['s-006', 'littleroot-town', 5, 42, 'city', 'rival', 'game'], // 휘웅
    ['d-196', 'lilycove-city', 6, 43, 'city', 'ally', 'game'], // 루티아
    ['c-126', 'mossdeep-city', 6, 44, 'city', 'trainer', 'game'], // 풍&란
    ['b-051', 'mt-pyre', 6, 45, 'cave', 'trainer', 'game'], // 회연
    ['b-052', 'shoal-cave', 6, 45, 'cave', 'trainer', 'game'], // 미혜
    ['a-029', 'granite-cave', 6, 47, 'cave', 'trainer', 'game'], // 성호
    ['b-055', 'seafloor-cavern', 7, 42, 'cave', 'villain', 'game', 'archie'], // 아강
    ['c-127', 'sootopolis-city', 7, 50, 'city', 'trainer', 'game'], // 아단
    ['c-128', 'sky-pillar', 7, 50, 'ruins', 'trainer', 'game'], // 피아나
    ['b-057', 'cave-of-origin', 7, 51, 'cave', 'trainer', 'game'], // 윤진
    ['b-050', 'hoenn-victory-road', 8, 59, 'cave', 'trainer', 'game'], // 혁진
    ['factory-clown', 'battle-frontier', 8, 60, 'arena', 'trainer', 'game'], // 팩토리 삐에로
  ],
  sinnoh: [
    ['d-227', 'lake-verity', 0, 6, 'coast', 'trainer', 'game'], // 찬석
    ['c-129', 'oreburgh-mine', 0, 7, 'cave', 'trainer', 'game'], // 강석
    ['c-137', 'route-203', 0, 7, 'route', 'rival', 'game', 'barry'], // 용식
    ['c-184', 'oreburgh-gate', 0, 7, 'cave', 'trainer', 'game'], // 르푸
    ['d-197', 'eterna-forest', 1, 13, 'forest', 'ally', 'game', 'cheryl'], // 모미
    ['d-232', 'valley-windworks', 1, 13, 'cave', 'ally', 'game'], // 핸섬
    ['c-130', 'eterna-city', 1, 14, 'city', 'trainer', 'game'], // 유채
    ['d-198', 'wayward-cave', 2, 19, 'cave', 'ally', 'game'], // 미루
    ['c-133', 'amity-square', 2, 20, 'cave', 'trainer', 'game'], // 멜리사
    ['c-176', 'route-206', 2, 20, 'route', 'trainer', 'game'], // 미도
    ['c-179', 'mt-coronet', 2, 20, 'cave', 'trainer', 'game'], // 동백
    ['b-058', 'floaroma-meadow', 2, 21, 'forest', 'trainer', 'game'], // 충호
    ['s-009', 'hearthome-city', 2, 25, 'arena', 'ally', 'both', 'dawn'], // 빛나
    ['d-234', 'route-215', 3, 25, 'route', 'rival', 'anime'], // 진철
    ['c-131', 'veilstone-city', 3, 26, 'city', 'trainer', 'game'], // 자두
    ['c-132', 'great-marsh', 4, 33, 'cave', 'trainer', 'game'], // 맥실러
    ['c-181', 'valor-lakefront', 4, 33, 'coast', 'trainer', 'game'], // 단지
    ['b-059', 'ruin-maniac-cave', 4, 34, 'cave', 'trainer', 'game'], // 들국화
    ['d-199', 'iron-island', 5, 34, 'cave', 'ally', 'game', 'riley'], // 현이
    ['c-178', 'route-220', 5, 38, 'route', 'trainer', 'game'], // 억새
    ['c-182', 'fuego-ironworks', 5, 38, 'cave', 'trainer', 'game'], // 포화
    ['b-061', 'canalave-city', 5, 39, 'city', 'trainer', 'game'], // 오엽
    ['s-008', 'sandgem-town', 5, 42, 'city', 'rival', 'game'], // 광휘
    ['s-022', 'jubilife-city', 5, 42, 'city', 'rival', 'game'], // 영빈
    ['s-023', 'twinleaf-town', 5, 42, 'city', 'rival', 'game'], // 윤슬
    ['c-135', 'snowpoint-city', 6, 44, 'city', 'trainer', 'game'], // 무청
    ['c-183', 'acuity-lakefront', 6, 44, 'coast', 'trainer', 'game'], // 라나
    ['a-030', 'celestic-town', 6, 47, 'city', 'trainer', 'game'], // 난천
    ['b-062', 'spear-pillar', 7, 47, 'ruins', 'villain', 'game', 'cyrus'], // 태홍
    ['d-228', 'lake-acuity', 7, 49, 'coast', 'trainer', 'game'], // 주혜
    ['c-136', 'sunyshore-city', 7, 50, 'city', 'trainer', 'game'], // 전진
    ['c-177', 'lake-valor', 7, 50, 'coast', 'trainer', 'game'], // 성화
    ['b-230', 'galactic-hq', 7, 51, 'hideout', 'villain', 'anime'], // J
    ['a-036', 'turnback-cave', 7, 53, 'cave', 'villain', 'game'], // 월로
    ['d-200', 'seabreak-path', 8, 57, 'cave', 'ally', 'game'], // 미정
    ['d-201', 'stark-mountain', 8, 57, 'volcano', 'ally', 'game'], // 맥
    ['c-134', 'iron-ruins', 8, 58, 'ruins', 'trainer', 'game'], // 동관
    ['c-138', 'sinnoh-battle-frontier', 8, 58, 'arena', 'trainer', 'game'], // 종수
    ['c-180', 'snowpoint-temple', 8, 58, 'ruins', 'trainer', 'game'], // 사비
    ['b-060', 'fight-area', 8, 59, 'city', 'trainer', 'game'], // 대엽
    ['b-231', 'sinnoh-league', 8, 59, 'arena', 'rival', 'anime'], // 택트
  ],
  unova: [
    ['s-012', 'floccesy-ranch', 0, 7, 'route', 'rival', 'game'], // 공명
    ['c-148', 'virbank-complex', 1, 14, 'cave', 'trainer', 'game'], // 보미카
    ['c-141', 'castelia-city', 2, 20, 'city', 'trainer', 'game'], // 아티
    ['d-202', 'unova-route-4', 3, 20, 'desert', 'rival', 'game', 'bianca'], // 벨
    ['d-203', 'battle-subway', 3, 25, 'arena', 'trainer', 'game'], // 상행
    ['d-204', 'anville-town', 3, 25, 'city', 'trainer', 'game'], // 하행
    ['d-205', 'join-avenue', 3, 25, 'cave', 'trainer', 'game'], // 철권
    ['d-206', 'lostlorn-forest', 3, 25, 'forest', 'trainer', 'game'], // 루리
    ['c-142', 'nimbasa-city', 3, 26, 'city', 'trainer', 'game'], // 카밀레
    ['c-147', 'unova-route-5', 4, 29, 'route', 'rival', 'game', 'cheren'], // 체렌
    ['c-143', 'driftveil-city', 4, 33, 'city', 'trainer', 'game'], // 야콘
    ['b-067', 'chargestone-cave', 5, 29, 'cave', 'rival', 'game', 'n'], // N
    ['d-235', 'unova-route-7', 5, 37, 'route', 'rival', 'anime'], // 철이
    ['c-144', 'mistralton-city', 5, 38, 'city', 'trainer', 'game'], // 풍란
    ['b-063', 'celestial-tower', 5, 39, 'ruins', 'trainer', 'game'], // 망초
    ['s-013', 'pokestar-studios', 5, 42, 'cave', 'rival', 'game'], // 명희
    ['c-146', 'opelucid-city', 6, 44, 'city', 'trainer', 'game'], // 사간
    ['b-065', 'undella-town', 6, 45, 'city', 'trainer', 'game'], // 카틀레야
    ['a-031', 'floccesy-town', 6, 47, 'city', 'trainer', 'game'], // 노간주
    ['b-068', 'plasma-frigate', 7, 48, 'hideout', 'villain', 'game', 'colress'], // 아크로마
    ['c-149', 'humilau-city', 7, 50, 'city', 'trainer', 'game'], // 시즈
    ['b-069', 'giant-chasm', 8, 56, 'cave', 'villain', 'game', 'ghetsis'], // 게치스
    ['c-139', 'striaton-city', 8, 58, 'city', 'trainer', 'game'], // 덴트&콘&팟
    ['c-140', 'nacrene-city', 8, 58, 'city', 'trainer', 'game'], // 알로에
    ['c-145', 'icirrus-city', 8, 58, 'city', 'trainer', 'game'], // 담죽
    ['b-064', 'black-city', 8, 59, 'city', 'trainer', 'game'], // 블래리
    ['b-066', 'unova-victory-road', 8, 59, 'cave', 'trainer', 'game'], // 연무
    ['b-070', 'ns-castle', 8, 59, 'cave', 'villain', 'game'], // 구아버
    ['a-032', 'unova-league', 8, 61, 'arena', 'trainer', 'game'], // 아이리스
    ['s-010', 'nuvema-town', 8, 62, 'city', 'rival', 'game'], // 투지
    ['s-011', 'unova-route-1', 8, 62, 'route', 'rival', 'game'], // 투희
  ],
  kalos: [
    ['d-207', 'aquacorde-town', 0, 5, 'city', 'rival', 'game', 'shauna'], // 사나
    ['d-215', 'santalune-forest', 0, 6, 'forest', 'ally', 'game'], // 안샤
    ['c-150', 'santalune-city', 0, 7, 'city', 'trainer', 'game'], // 비올라
    ['d-208', 'kalos-route-5', 1, 10, 'route', 'ally', 'game', 'tierno'], // 티에르노
    ['d-214', 'parfum-palace', 1, 13, 'ruins', 'ally', 'game'], // 이노
    ['d-217', 'ambrette-town', 1, 13, 'city', 'ally', 'game'], // 머스캣
    ['d-218', 'shabboneau-castle', 1, 13, 'cave', 'trainer', 'game'], // 시로
    ['d-233', 'kalos-route-4', 1, 13, 'route', 'ally', 'game'], // 유리카
    ['c-151', 'cyllage-city', 1, 14, 'city', 'trainer', 'game'], // 자크로
    ['d-209', 'kalos-route-7', 1, 15, 'route', 'ally', 'game', 'trevor'], // 트로바
    ['c-152', 'tower-of-mastery', 2, 20, 'ruins', 'trainer', 'game'], // 코르니
    ['b-076', 'geosenge-town', 2, 21, 'city', 'trainer', 'game'], // AZ
    ['c-153', 'coumarine-city', 3, 26, 'city', 'trainer', 'game'], // 후쿠지
    ['b-073', 'azure-bay', 3, 27, 'coast', 'trainer', 'game'], // 즈미
    ['d-216', 'kalos-power-plant', 4, 32, 'hideout', 'trainer', 'game'], // 카나리
    ['d-220', 'kalos-route-13', 4, 32, 'route', 'villain', 'game'], // 카라스바
    ['c-154', 'prism-tower', 4, 33, 'ruins', 'trainer', 'game'], // 시트론
    ['d-212', 'kalos-route-14', 5, 37, 'route', 'rival', 'game'], // 타니
    ['d-213', 'poke-ball-factory', 5, 37, 'hideout', 'ally', 'game'], // 루디
    ['c-155', 'laverre-city', 5, 38, 'city', 'trainer', 'game'], // 마슈
    ['s-014', 'vaniville-town', 5, 42, 'city', 'rival', 'game'], // 칼름
    ['s-017', 'battle-chateau', 5, 42, 'arena', 'rival', 'game'], // 새아
    ['d-210', 'lost-hotel', 6, 43, 'cave', 'trainer', 'game'], // 마티에르
    ['d-211', 'kalos-route-16', 6, 43, 'route', 'rival', 'game'], // 가이
    ['s-015', 'anistar-city', 6, 43, 'city', 'rival', 'game', 'serena'], // 세레나
    ['c-156', 'dendemille-town', 6, 44, 'city', 'trainer', 'game'], // 코지카
    ['b-075', 'team-flare-secret-hq', 7, 49, 'hideout', 'villain', 'game', 'lysandre'], // 플라드리
    ['c-157', 'pokemon-village', 7, 50, 'cave', 'trainer', 'game'], // 우르프
    ['b-072', 'lysandre-labs', 7, 51, 'aether-lab', 'trainer', 'game'], // 파키라
    ['b-074', 'terminus-cave', 7, 51, 'cave', 'trainer', 'game'], // 드라세나
    ['b-104', 'lumiose-city', 7, 51, 'arena', 'rival', 'anime', 'alain'], // 알랭
    ['d-219', 'friend-safari', 8, 57, 'cave', 'trainer', 'game'], // 무쿠
    ['d-236', 'kiloude-city', 8, 57, 'city', 'rival', 'anime'], // 승태
    ['b-071', 'kalos-victory-road', 8, 59, 'cave', 'trainer', 'game'], // 간피
    ['a-033', 'kalos-pokemon-league', 8, 61, 'arena', 'trainer', 'game'], // 카르네
    ['s-016', 'battle-maison', 8, 62, 'arena', 'rival', 'game'], // 공준
  ],
  alola: [
    ['b-077', 'iki-town', 0, 5, 'arena', 'rival', 'game', 'hau'], // 하우
    ['c-158', 'hauoli-city', 0, 9, 'city', 'ally', 'game', 'ilima'], // 일리마
    ['d-221', 'melemele-meadow', 1, 13, 'forest', 'ally', 'game'], // 릴리에
    ['d-223', 'alola-route-5', 2, 16, 'route', 'rival', 'game', 'gladion'], // 글라디오
    ['c-159', 'brooklet-hill', 2, 18, 'coast', 'trainer', 'game'], // 수련
    ['b-078', 'mahalo-trail', 2, 19, 'route', 'trainer', 'game'], // 할라
    ['c-162', 'wela-volcano-park', 3, 22, 'forest', 'trainer', 'game'], // 키아웨
    ['c-160', 'lush-jungle', 4, 26, 'forest', 'trainer', 'game'], // 마오
    ['b-079', 'konikoni-city', 5, 32, 'city', 'trainer', 'game'], // 라이치
    ['s-018', 'alola-route-1', 5, 35, 'route', 'trainer', 'game'], // 영태
    ['s-019', 'hauoli-outskirts', 5, 35, 'route', 'trainer', 'game'], // 미월
    ['c-161', 'hokulani-observatory', 6, 36, 'aether-lab', 'trainer', 'game'], // 마마네
    ['b-082', 'mount-hokulani', 6, 37, 'cave', 'trainer', 'game'], // 멀레인
    ['d-222', 'shady-house', 7, 37, 'hideout', 'villain', 'game', 'guzma'], // 구즈마
    ['c-164', 'aether-house', 7, 40, 'aether-lab', 'villain', 'game'], // 자우보
    ['b-080', 'abandoned-thrifty-megamart', 7, 41, 'cave', 'trainer', 'game'], // 아세로라
    ['b-083', 'alola-route-17', 7, 41, 'route', 'trainer', 'game'], // 나누
    ['b-085', 'aether-paradise', 8, 42, 'aether-lab', 'villain', 'game', 'lusamine'], // 루자미네
    ['c-163', 'seafolk-village', 9, 49, 'coast', 'trainer', 'game'], // 말리화
    ['b-084', 'poni-breaker-coast', 9, 50, 'coast', 'trainer', 'game'], // 하푸우
    ['d-224', 'vast-poni-canyon', 10, 53, 'cave', 'trainer', 'game'], // 용규
    ['b-081', 'mount-lanakila', 11, 60, 'cave', 'trainer', 'game'], // 카일리
    ['a-034', 'alola-pokemon-league', 11, 62, 'arena', 'trainer', 'game'], // 쿠쿠이박사
  ],
  galar: [
    ['b-088', 'galar-route-2', 0, 6, 'route', 'rival', 'game', 'hop'], // 호브
    ['c-165', 'turffield', 0, 7, 'city', 'trainer', 'game'], // 아킬
    ['c-167', 'motostoke', 0, 7, 'city', 'trainer', 'game'], // 순무
    ['c-169', 'watchtower-ruins', 0, 7, 'ruins', 'trainer', 'game'], // 어니언
    ['b-089', 'galar-mine', 0, 14, 'cave', 'rival', 'game', 'bede'], // 비트
    ['c-166', 'hulbury', 1, 14, 'city', 'trainer', 'game'], // 야청
    ['c-175', 'galar-mine-no-2', 2, 20, 'cave', 'trainer', 'game'], // 피오니
    ['d-226', 'dusty-bowl', 3, 25, 'route', 'trainer', 'game'], // 세이버리
    ['c-168', 'stow-on-side', 3, 26, 'city', 'trainer', 'game'], // 채두
    ['c-174', 'hammerlocke', 3, 26, 'city', 'trainer', 'game'], // 금랑
    ['d-225', 'glimwood-tangle', 4, 32, 'forest', 'trainer', 'game'], // 도청
    ['c-170', 'ballonlea', 4, 33, 'city', 'trainer', 'game'], // 포플러
    ['c-171', 'circhester', 5, 38, 'city', 'trainer', 'game'], // 마쿠와
    ['c-172', 'steamdrift-way', 5, 38, 'route', 'trainer', 'game'], // 멜론
    ['s-020', 'postwick', 5, 42, 'city', 'rival', 'game'], // 승재
    ['s-021', 'wedgehurst', 5, 42, 'city', 'rival', 'game'], // 우리
    ['b-090', 'outer-spikemuth', 6, 43, 'city', 'rival', 'game', 'marnie'], // 마리
    ['c-173', 'spikemuth', 6, 44, 'city', 'trainer', 'game'], // 두송
    ['b-087', 'lake-of-outrage', 6, 45, 'coast', 'trainer', 'game'], // 마스터드
    ['b-086', 'energy-plant', 8, 55, 'hideout', 'villain', 'game', 'rose'], // 로즈
    ['b-229', 'galar-rose-tower', 8, 59, 'hideout', 'trainer', 'game'], // 반디나
    ['a-035', 'wyndon-stadium', 8, 61, 'arena', 'trainer', 'game'], // 단델
  ],
  paldea: [
    ['b-091', 'cabo-poco', 0, 5, 'coast', 'rival', 'game', 'nemona'], // 네모
    ['c-185', 'cortondo', 0, 7, 'city', 'trainer', 'game'], // 단풍
    ['c-186', 'artazon', 0, 7, 'city', 'trainer', 'game'], // 콜사
    ['c-187', 'levincia', 2, 20, 'city', 'trainer', 'game'], // 모야모
    ['b-095', 'south-province-area-three', 2, 21, 'route', 'trainer', 'game'], // 뽀삐
    ['b-098', 'segin-squad', 2, 21, 'hideout', 'rival', 'game'], // 카지
    ['b-099', 'south-province-area-two', 2, 21, 'route', 'trainer', 'game'], // 타로
    ['c-188', 'cascarrafa', 3, 26, 'city', 'trainer', 'game'], // 곤포
    ['b-100', 'east-province-area-three', 3, 27, 'route', 'trainer', 'game'], // 하솔
    ['b-092', 'asado-desert', 4, 33, 'desert', 'ally', 'game', 'arven'], // 페퍼
    ['b-102', 'casseroya-lake', 4, 34, 'coast', 'trainer', 'game'], // 제빈
    ['c-189', 'montenevera', 5, 38, 'city', 'trainer', 'game'], // 라임
    ['b-094', 'dalizapa-passage', 5, 39, 'cave', 'trainer', 'game'], // 칠리
    ['b-103', 'medali', 5, 39, 'city', 'trainer', 'game'], // 청목
    ['s-024', 'poco-path-lighthouse', 5, 42, 'coast', 'rival', 'game'], // 보민
    ['s-025', 'mesagoza', 5, 42, 'city', 'rival', 'game'], // 푸름
    ['c-190', 'alfornada', 6, 44, 'city', 'trainer', 'game'], // 리파
    ['b-101', 'north-province-area-one', 6, 45, 'route', 'trainer', 'game'], // 네리네
    ['a-039', 'los-platos', 6, 47, 'city', 'rival', 'anime'], // 리코
    ['c-191', 'glaseado-gym', 7, 50, 'arena', 'trainer', 'game'], // 그루샤
    ['b-093', 'naranja-academy', 7, 58, 'school', 'ally', 'game', 'penny'], // 모란
    ['b-097', 'zero-gate', 8, 59, 'cave', 'trainer', 'game'], // 팔자크
    ['a-037', 'paldea-pokemon-league', 8, 61, 'arena', 'trainer', 'game'], // 테사
    ['b-096', 'inlet-grotto', 8, 65, 'cave', 'trainer', 'game'], // 스포일러
  ],
}
