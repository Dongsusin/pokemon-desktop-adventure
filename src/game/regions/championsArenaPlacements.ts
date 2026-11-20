import type { FieldTrainer, FieldVenue } from './fieldTrainers'
import type { RegionId } from './world'

// Local map positions and venues. Old keys identify returning opponents in v0.27 saves.
type Placement = readonly [sourceId: string, locationId: string, venue: FieldVenue, kind: FieldTrainer['kind'], series: FieldTrainer['series'], existingKey?: string]

// Active pre-v26 encounters can finish at the original site after an update.
export const previousFieldLocations: Readonly<Record<string, string | undefined>> = {
  'field-kanto-b-040': 'pallet-town', 'field-kalos-d-215': 'santalune-forest', 'field-paldea-s-025': 'mesagoza',
}

export const arenaPlacements: Readonly<Record<RegionId, readonly Placement[]>> = {
  kanto: [
    ['a-038', 'viridian-forest', 'forest', 'ally', 'anime', 'ash'], // 지우
    ['d-237', 'viridian-city', 'city', 'rival', 'anime'], // 고우
    ['d-238', 'route-1', 'route', 'ally', 'anime'], // 채하루
    ['c-105', 'pewter-city', 'city', 'trainer', 'game'], // 웅
    ['d-193', 'mt-moon', 'cave', 'villain', 'both', 'rocket-duo'], // 로사&로이
    ['c-106', 'cerulean-city', 'city', 'trainer', 'game'], // 이슬
    ['a-026', 'ss-anne', 'ship', 'rival', 'game', 'blue'], // 그린
    ['c-107', 'vermilion-city', 'city', 'trainer', 'game'], // 마티스
    ['b-040', 'indigo-plateau', 'arena', 'ally', 'game'], // 오박사
    ['b-042', 'rock-tunnel', 'cave', 'trainer', 'game'], // 시바
    ['c-108', 'celadon-city', 'city', 'trainer', 'game'], // 민화
    ['b-043', 'pokemon-tower', 'ruins', 'trainer', 'game'], // 국화
    ['c-109', 'fuchsia-city', 'city', 'trainer', 'game'], // 도희
    ['c-110', 'saffron-city', 'city', 'trainer', 'game'], // 초련
    ['b-045', 'silph-co', 'hideout', 'villain', 'both', 'giovanni'], // 비주기
    ['b-041', 'seafoam-islands', 'cave', 'trainer', 'game'], // 칸나
    ['s-002', 'route-22', 'route', 'trainer', 'game'], // 태주
    ['s-003', 'sea-cottage', 'coast', 'trainer', 'game'], // 보연
    ['c-111', 'cinnabar-island', 'coast', 'trainer', 'game'], // 강연
    ['a-027', 'route-24', 'route', 'rival', 'game'], // 진우
    ['b-044', 'cerulean-cave', 'cave', 'trainer', 'game'], // 블루
    ['s-001', 'victory-road', 'cave', 'trainer', 'game'], // 레드
  ],
  johto: [
    ['d-194', 'cherrygrove-city', 'city', 'rival', 'game', 'silver'], // 실버
    ['c-112', 'violet-city', 'city', 'trainer', 'game'], // 비상
    ['c-113', 'azalea-town', 'city', 'trainer', 'game'], // 호일
    ['boss-proton-petrel', 'slowpoke-well', 'cave', 'villain', 'game'], // 랜스 / 란다
    ['c-114', 'goldenrod-city', 'city', 'trainer', 'game'], // 꼭두
    ['b-046', 'ruins-of-alph', 'ruins', 'trainer', 'game'], // 일목
    ['b-047', 'dark-cave', 'cave', 'trainer', 'game'], // 카렌
    ['c-115', 'ecruteak-city', 'city', 'trainer', 'game'], // 유진
    ['d-195', 'cianwood-city', 'coast', 'ally', 'game', 'eusine'], // 수호
    ['c-116', 'whirl-islands', 'cave', 'trainer', 'game'], // 사도
    ['c-117', 'olivine-lighthouse', 'coast', 'trainer', 'game'], // 규리
    ['s-004', 'new-bark-town', 'city', 'rival', 'game'], // 심향
    ['s-005', 'national-park', 'forest', 'rival', 'game'], // 금선
    ['boss-ariana-archer', 'mahogany-town', 'hideout', 'villain', 'game'], // 아테나 / 아폴로
    ['a-028', 'lake-of-rage', 'coast', 'trainer', 'game'], // 목호
    ['d-192', 'goldenrod-radio-tower', 'hideout', 'villain', 'game', 'archer'], // 아폴로
    ['c-118', 'ice-path', 'cave', 'trainer', 'game'], // 류옹
    ['c-119', 'dragons-den', 'cave', 'trainer', 'game'], // 이향
    ['b-048', 'johto-victory-road', 'cave', 'trainer', 'game'], // 독수
  ],
  hoenn: [
    ['s-007', 'route-103', 'route', 'rival', 'game', 'may'], // 봄이
    ['c-120', 'rustboro-city', 'city', 'trainer', 'game'], // 원규
    ['c-124', 'petalburg-city', 'city', 'trainer', 'game'], // 종길
    ['c-121', 'dewford-town', 'city', 'trainer', 'game'], // 철구
    ['b-049', 'mauville-city', 'city', 'rival', 'game', 'wally'], // 민진
    ['b-054', 'mt-chimney', 'volcano', 'villain', 'game', 'maxie'], // 마적
    ['c-123', 'lavaridge-town', 'city', 'trainer', 'game'], // 민지
    ['b-053', 'meteor-falls', 'cave', 'trainer', 'game'], // 권수
    ['c-122', 'new-mauville', 'cave', 'trainer', 'game'], // 암페어
    ['c-125', 'fortree-city', 'city', 'trainer', 'game'], // 은송
    ['b-056', 'abandoned-ship', 'ship', 'trainer', 'game'], // 기선
    ['s-006', 'littleroot-town', 'city', 'rival', 'game'], // 휘웅
    ['d-196', 'lilycove-city', 'city', 'ally', 'game'], // 루티아
    ['c-126', 'mossdeep-city', 'city', 'trainer', 'game'], // 풍&란
    ['b-051', 'mt-pyre', 'cave', 'trainer', 'game'], // 회연
    ['b-052', 'shoal-cave', 'cave', 'trainer', 'game'], // 미혜
    ['a-029', 'granite-cave', 'cave', 'trainer', 'game'], // 성호
    ['b-055', 'seafloor-cavern', 'cave', 'villain', 'game', 'archie'], // 아강
    ['c-127', 'sootopolis-city', 'city', 'trainer', 'game'], // 아단
    ['c-128', 'sky-pillar', 'ruins', 'trainer', 'game'], // 피아나
    ['b-057', 'cave-of-origin', 'cave', 'trainer', 'game'], // 윤진
    ['b-050', 'hoenn-victory-road', 'cave', 'trainer', 'game'], // 혁진
    ['factory-clown', 'battle-frontier', 'arena', 'trainer', 'game'], // 팩토리 삐에로
  ],
  sinnoh: [
    ['d-227', 'lake-verity', 'coast', 'trainer', 'game'], // 찬석
    ['c-129', 'oreburgh-mine', 'cave', 'trainer', 'game'], // 강석
    ['c-137', 'route-203', 'route', 'rival', 'game', 'barry'], // 용식
    ['c-184', 'oreburgh-gate', 'cave', 'trainer', 'game'], // 르푸
    ['d-197', 'eterna-forest', 'forest', 'ally', 'game', 'cheryl'], // 모미
    ['d-232', 'valley-windworks', 'cave', 'ally', 'game'], // 핸섬
    ['c-130', 'eterna-city', 'city', 'trainer', 'game'], // 유채
    ['d-198', 'wayward-cave', 'cave', 'ally', 'game'], // 미루
    ['c-133', 'amity-square', 'cave', 'trainer', 'game'], // 멜리사
    ['c-176', 'route-206', 'route', 'trainer', 'game'], // 미도
    ['c-179', 'mt-coronet', 'cave', 'trainer', 'game'], // 동백
    ['b-058', 'floaroma-meadow', 'forest', 'trainer', 'game'], // 충호
    ['s-009', 'hearthome-city', 'arena', 'ally', 'both', 'dawn'], // 빛나
    ['d-234', 'route-215', 'route', 'rival', 'anime'], // 진철
    ['c-131', 'veilstone-city', 'city', 'trainer', 'game'], // 자두
    ['c-132', 'great-marsh', 'cave', 'trainer', 'game'], // 맥실러
    ['c-181', 'valor-lakefront', 'coast', 'trainer', 'game'], // 단지
    ['b-059', 'ruin-maniac-cave', 'cave', 'trainer', 'game'], // 들국화
    ['d-199', 'iron-island', 'cave', 'ally', 'game', 'riley'], // 현이
    ['c-178', 'route-220', 'route', 'trainer', 'game'], // 억새
    ['c-182', 'fuego-ironworks', 'cave', 'trainer', 'game'], // 포화
    ['b-061', 'canalave-city', 'city', 'trainer', 'game'], // 오엽
    ['s-008', 'sandgem-town', 'city', 'rival', 'game'], // 광휘
    ['s-022', 'jubilife-city', 'city', 'rival', 'game'], // 영빈
    ['s-023', 'twinleaf-town', 'city', 'rival', 'game'], // 윤슬
    ['c-135', 'snowpoint-city', 'city', 'trainer', 'game'], // 무청
    ['c-183', 'acuity-lakefront', 'coast', 'trainer', 'game'], // 라나
    ['a-030', 'celestic-town', 'city', 'trainer', 'game'], // 난천
    ['b-062', 'spear-pillar', 'ruins', 'villain', 'game', 'cyrus'], // 태홍
    ['d-228', 'lake-acuity', 'coast', 'trainer', 'game'], // 주혜
    ['c-136', 'sunyshore-city', 'city', 'trainer', 'game'], // 전진
    ['c-177', 'lake-valor', 'coast', 'trainer', 'game'], // 성화
    ['b-230', 'galactic-hq', 'hideout', 'villain', 'anime'], // J
    ['a-036', 'turnback-cave', 'cave', 'villain', 'game'], // 월로
    ['d-200', 'seabreak-path', 'cave', 'ally', 'game'], // 미정
    ['d-201', 'stark-mountain', 'volcano', 'ally', 'game'], // 맥
    ['c-134', 'iron-ruins', 'ruins', 'trainer', 'game'], // 동관
    ['c-138', 'sinnoh-battle-frontier', 'arena', 'trainer', 'game'], // 종수
    ['c-180', 'snowpoint-temple', 'ruins', 'trainer', 'game'], // 사비
    ['b-060', 'fight-area', 'city', 'trainer', 'game'], // 대엽
    ['b-231', 'sinnoh-league', 'arena', 'rival', 'anime'], // 택트
  ],
  unova: [
    ['s-012', 'floccesy-ranch', 'route', 'rival', 'game'], // 공명
    ['c-148', 'virbank-complex', 'cave', 'trainer', 'game'], // 보미카
    ['c-141', 'castelia-city', 'city', 'trainer', 'game'], // 아티
    ['d-202', 'unova-route-4', 'desert', 'rival', 'game', 'bianca'], // 벨
    ['d-203', 'battle-subway', 'arena', 'trainer', 'game'], // 상행
    ['d-204', 'anville-town', 'city', 'trainer', 'game'], // 하행
    ['d-205', 'join-avenue', 'cave', 'trainer', 'game'], // 철권
    ['d-206', 'lostlorn-forest', 'forest', 'trainer', 'game'], // 루리
    ['c-142', 'nimbasa-city', 'city', 'trainer', 'game'], // 카밀레
    ['c-147', 'unova-route-5', 'route', 'rival', 'game', 'cheren'], // 체렌
    ['c-143', 'driftveil-city', 'city', 'trainer', 'game'], // 야콘
    ['b-067', 'chargestone-cave', 'cave', 'rival', 'game', 'n'], // N
    ['d-235', 'unova-route-7', 'route', 'rival', 'anime'], // 철이
    ['c-144', 'mistralton-city', 'city', 'trainer', 'game'], // 풍란
    ['b-063', 'celestial-tower', 'ruins', 'trainer', 'game'], // 망초
    ['s-013', 'pokestar-studios', 'cave', 'rival', 'game'], // 명희
    ['c-146', 'opelucid-city', 'city', 'trainer', 'game'], // 사간
    ['b-065', 'undella-town', 'city', 'trainer', 'game'], // 카틀레야
    ['a-031', 'floccesy-town', 'city', 'trainer', 'game'], // 노간주
    ['b-068', 'plasma-frigate', 'hideout', 'villain', 'game', 'colress'], // 아크로마
    ['c-149', 'humilau-city', 'city', 'trainer', 'game'], // 시즈
    ['b-069', 'giant-chasm', 'cave', 'villain', 'game', 'ghetsis'], // 게치스
    ['c-139', 'striaton-city', 'city', 'trainer', 'game'], // 덴트&콘&팟
    ['c-140', 'nacrene-city', 'city', 'trainer', 'game'], // 알로에
    ['c-145', 'icirrus-city', 'city', 'trainer', 'game'], // 담죽
    ['b-064', 'black-city', 'city', 'trainer', 'game'], // 블래리
    ['b-066', 'unova-victory-road', 'cave', 'trainer', 'game'], // 연무
    ['b-070', 'ns-castle', 'cave', 'villain', 'game'], // 구아버
    ['a-032', 'unova-league', 'arena', 'trainer', 'game'], // 아이리스
    ['s-010', 'nuvema-town', 'city', 'rival', 'game'], // 투지
    ['s-011', 'unova-route-1', 'route', 'rival', 'game'], // 투희
  ],
  kalos: [
    ['d-207', 'aquacorde-town', 'city', 'rival', 'game', 'shauna'], // 사나
    ['d-215', 'chamber-of-emptiness', 'ruins', 'ally', 'game'], // 안샤
    ['c-150', 'santalune-city', 'city', 'trainer', 'game'], // 비올라
    ['d-208', 'kalos-route-5', 'route', 'ally', 'game', 'tierno'], // 티에르노
    ['d-214', 'parfum-palace', 'ruins', 'ally', 'game'], // 이노
    ['d-217', 'ambrette-town', 'city', 'ally', 'game'], // 머스캣
    ['d-218', 'shabboneau-castle', 'cave', 'trainer', 'game'], // 시로
    ['d-233', 'kalos-route-4', 'route', 'ally', 'game'], // 유리카
    ['c-151', 'cyllage-city', 'city', 'trainer', 'game'], // 자크로
    ['d-209', 'kalos-route-7', 'route', 'ally', 'game', 'trevor'], // 트로바
    ['c-152', 'tower-of-mastery', 'ruins', 'trainer', 'game'], // 코르니
    ['b-076', 'geosenge-town', 'city', 'trainer', 'game'], // AZ
    ['c-153', 'coumarine-city', 'city', 'trainer', 'game'], // 후쿠지
    ['b-073', 'azure-bay', 'coast', 'trainer', 'game'], // 즈미
    ['d-216', 'kalos-power-plant', 'hideout', 'trainer', 'game'], // 카나리
    ['d-220', 'kalos-route-13', 'route', 'villain', 'game'], // 카라스바
    ['c-154', 'prism-tower', 'ruins', 'trainer', 'game'], // 시트론
    ['d-212', 'kalos-route-14', 'route', 'rival', 'game'], // 타니
    ['d-213', 'poke-ball-factory', 'hideout', 'ally', 'game'], // 루디
    ['c-155', 'laverre-city', 'city', 'trainer', 'game'], // 마슈
    ['s-014', 'vaniville-town', 'city', 'rival', 'game'], // 칼름
    ['s-017', 'battle-chateau', 'arena', 'rival', 'game'], // 새아
    ['d-210', 'lost-hotel', 'cave', 'trainer', 'game'], // 마티에르
    ['d-211', 'kalos-route-16', 'route', 'rival', 'game'], // 가이
    ['s-015', 'anistar-city', 'city', 'rival', 'game', 'serena'], // 세레나
    ['c-156', 'dendemille-town', 'city', 'trainer', 'game'], // 코지카
    ['b-075', 'team-flare-secret-hq', 'hideout', 'villain', 'game', 'lysandre'], // 플라드리
    ['c-157', 'pokemon-village', 'cave', 'trainer', 'game'], // 우르프
    ['b-072', 'lysandre-labs', 'aether-lab', 'trainer', 'game'], // 파키라
    ['b-074', 'terminus-cave', 'cave', 'trainer', 'game'], // 드라세나
    ['b-104', 'lumiose-city', 'arena', 'rival', 'anime', 'alain'], // 알랭
    ['d-219', 'friend-safari', 'cave', 'trainer', 'game'], // 무쿠
    ['d-236', 'kiloude-city', 'city', 'rival', 'anime'], // 승태
    ['b-071', 'kalos-victory-road', 'cave', 'trainer', 'game'], // 간피
    ['a-033', 'kalos-pokemon-league', 'arena', 'trainer', 'game'], // 카르네
    ['s-016', 'battle-maison', 'arena', 'rival', 'game'], // 공준
  ],
  alola: [
    ['b-077', 'iki-town', 'arena', 'rival', 'game', 'hau'], // 하우
    ['c-158', 'hauoli-city', 'city', 'ally', 'game', 'ilima'], // 일리마
    ['d-221', 'melemele-meadow', 'forest', 'ally', 'game'], // 릴리에
    ['d-223', 'alola-route-5', 'route', 'rival', 'game', 'gladion'], // 글라디오
    ['c-159', 'brooklet-hill', 'coast', 'trainer', 'game'], // 수련
    ['b-078', 'mahalo-trail', 'route', 'trainer', 'game'], // 할라
    ['c-162', 'wela-volcano-park', 'forest', 'trainer', 'game'], // 키아웨
    ['c-160', 'lush-jungle', 'forest', 'trainer', 'game'], // 마오
    ['b-079', 'konikoni-city', 'city', 'trainer', 'game'], // 라이치
    ['s-018', 'alola-route-1', 'route', 'trainer', 'game'], // 영태
    ['s-019', 'hauoli-outskirts', 'route', 'trainer', 'game'], // 미월
    ['c-161', 'hokulani-observatory', 'aether-lab', 'trainer', 'game'], // 마마네
    ['b-082', 'mount-hokulani', 'cave', 'trainer', 'game'], // 멀레인
    ['d-222', 'shady-house', 'hideout', 'villain', 'game', 'guzma'], // 구즈마
    ['c-164', 'aether-house', 'aether-lab', 'villain', 'game'], // 자우보
    ['b-080', 'abandoned-thrifty-megamart', 'cave', 'trainer', 'game'], // 아세로라
    ['b-083', 'alola-route-17', 'route', 'trainer', 'game'], // 나누
    ['b-085', 'aether-paradise', 'aether-lab', 'villain', 'game', 'lusamine'], // 루자미네
    ['c-163', 'seafolk-village', 'coast', 'trainer', 'game'], // 말리화
    ['b-084', 'poni-breaker-coast', 'coast', 'trainer', 'game'], // 하푸우
    ['d-224', 'vast-poni-canyon', 'cave', 'trainer', 'game'], // 용규
    ['b-081', 'mount-lanakila', 'cave', 'trainer', 'game'], // 카일리
    ['a-034', 'alola-pokemon-league', 'arena', 'trainer', 'game'], // 쿠쿠이박사
  ],
  galar: [
    ['b-088', 'galar-route-2', 'route', 'rival', 'game', 'hop'], // 호브
    ['c-165', 'turffield', 'city', 'trainer', 'game'], // 아킬
    ['c-167', 'motostoke', 'city', 'trainer', 'game'], // 순무
    ['c-169', 'watchtower-ruins', 'ruins', 'trainer', 'game'], // 어니언
    ['b-089', 'galar-mine', 'cave', 'rival', 'game', 'bede'], // 비트
    ['c-166', 'hulbury', 'city', 'trainer', 'game'], // 야청
    ['c-175', 'galar-mine-no-2', 'cave', 'trainer', 'game'], // 피오니
    ['d-226', 'dusty-bowl', 'route', 'trainer', 'game'], // 세이버리
    ['c-168', 'stow-on-side', 'city', 'trainer', 'game'], // 채두
    ['c-174', 'hammerlocke', 'city', 'trainer', 'game'], // 금랑
    ['d-225', 'glimwood-tangle', 'forest', 'trainer', 'game'], // 도청
    ['c-170', 'ballonlea', 'city', 'trainer', 'game'], // 포플러
    ['c-171', 'circhester', 'city', 'trainer', 'game'], // 마쿠와
    ['c-172', 'steamdrift-way', 'route', 'trainer', 'game'], // 멜론
    ['s-020', 'postwick', 'city', 'rival', 'game'], // 승재
    ['s-021', 'wedgehurst', 'city', 'rival', 'game'], // 우리
    ['b-090', 'outer-spikemuth', 'city', 'rival', 'game', 'marnie'], // 마리
    ['c-173', 'spikemuth', 'city', 'trainer', 'game'], // 두송
    ['b-087', 'lake-of-outrage', 'coast', 'trainer', 'game'], // 마스터드
    ['b-086', 'energy-plant', 'hideout', 'villain', 'game', 'rose'], // 로즈
    ['b-229', 'galar-rose-tower', 'hideout', 'trainer', 'game'], // 반디나
    ['a-035', 'wyndon-stadium', 'arena', 'trainer', 'game'], // 단델
  ],
  paldea: [
    ['b-091', 'cabo-poco', 'coast', 'rival', 'game', 'nemona'], // 네모
    ['c-185', 'cortondo', 'city', 'trainer', 'game'], // 단풍
    ['c-186', 'artazon', 'city', 'trainer', 'game'], // 콜사
    ['c-187', 'levincia', 'city', 'trainer', 'game'], // 모야모
    ['b-095', 'south-province-area-three', 'route', 'trainer', 'game'], // 뽀삐
    ['b-098', 'segin-squad', 'hideout', 'rival', 'game'], // 카지
    ['b-099', 'south-province-area-two', 'route', 'trainer', 'game'], // 타로
    ['c-188', 'cascarrafa', 'city', 'trainer', 'game'], // 곤포
    ['b-100', 'east-province-area-three', 'route', 'trainer', 'game'], // 하솔
    ['b-092', 'asado-desert', 'desert', 'ally', 'game', 'arven'], // 페퍼
    ['b-102', 'casseroya-lake', 'coast', 'trainer', 'game'], // 제빈
    ['c-189', 'montenevera', 'city', 'trainer', 'game'], // 라임
    ['b-094', 'dalizapa-passage', 'cave', 'trainer', 'game'], // 칠리
    ['b-103', 'medali', 'city', 'trainer', 'game'], // 청목
    ['s-024', 'poco-path-lighthouse', 'coast', 'rival', 'game'], // 보민
    ['s-025', 'area-zero', 'ruins', 'rival', 'game'], // 푸름
    ['c-190', 'alfornada', 'city', 'trainer', 'game'], // 리파
    ['b-101', 'north-province-area-one', 'route', 'trainer', 'game'], // 네리네
    ['a-039', 'los-platos', 'city', 'rival', 'anime'], // 리코
    ['c-191', 'glaseado-gym', 'arena', 'trainer', 'game'], // 그루샤
    ['b-093', 'naranja-academy', 'school', 'ally', 'game', 'penny'], // 모란
    ['b-097', 'zero-gate', 'cave', 'trainer', 'game'], // 팔자크
    ['a-037', 'paldea-pokemon-league', 'arena', 'trainer', 'game'], // 테사
    ['b-096', 'inlet-grotto', 'cave', 'trainer', 'game'], // 스포일러
  ],
}
