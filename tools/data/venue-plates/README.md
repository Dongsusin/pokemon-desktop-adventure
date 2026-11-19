# 체육관·리그 배틀맵 원화

9개 지방의 체육관·시련 75곳과 리그·최종전 48개 대결을 위한 원화 시트입니다. 각 시트는 3행×3열이며 게임에 들어가는 장면의 순서와 이름은 [전장 인덱스](index.json)에 있습니다. 포켓몬 레조넌스의 원본 경기장과 소개 영상에서 카메라 시점, 두 포켓몬 사이 교전 공간과 도트의 크기를 참고했습니다. [레조넌스 제작자 페이지](https://reso.jhcloud.kr/)

아래 지시문과 전장별 사양으로 ImageGen에서 원화를 제작했습니다. 런타임에서는 잘라낸 배경 PNG를 로컬에서 읽습니다.

## 공통 원화 사양

```text
ASSET: full-bleed 3 by 3 tile atlas of NINE DIFFERENT FINISHED top-down Pokémon gym environments, 1536x1024 landscape canvas (3 columns, 3 equal rows). Exactly equal, edge-to-edge straight grid, no frames, seams or gutters, no captions. Every cell is its own complete 3:2 landscape BATTLE MAP videogame screenshot, naturally extends to all four cell boundaries. Art direction: exceptionally rich polished hand-clustered pixel art of a late Nintendo DS Pokémon battle RPG fan remake in the overhead view of Pokémon Resonance. Highly specific environmental storytelling, whole rooms, intricate 16-bit tiles, vivid contrasting colors, rich three-shade light and shadow, clear vertical wall fronts and overhangs, crisp small pixel edges. Commit to individual architecture, floor materials and terrain for each place. Strict bird's eye game map with north at top, only slight front of north walls visible, entirely walkable arena across middle 70%, broad open fighting floor with composed subtle inlays, sunlight, richer textural detail and shapes instead of plain blank color. Elaborate detailed structures, environmental props and dramatic lighting at perimeter. Make all nine look professional as individually authored maps. Avoid isometric perspective, distant panoramic landscapes, white dividers, lettering, writing, numbers, watermarks, interface, people, Pokémon, central sculptures, giant balls or outlined combat characters. The top left / top middle / top right scenes correspond to 1/2/3; middle row to 4/5/6; bottom row to 7/8/9. Each new location must be visibly different in both composition and central surface in a zoomed-in shot. Scene order:
```

## 시트별 장면

### 01

1. brock — terraced golden fossil quarry with wood bracing
2. misty — sunlit cyan indoor swimming pool, diving boards and red lane floats
3. lt-surge — Vermilion switchgear substation, yellow busbars and metal flooring
4. erika — lush glass conservatory garden and stepped flower beds
5. koga — violet Fuchsia ninja dojo with shoji screens and glass maze at perimeter
6. sabrina — futuristic psychic violet teleport-pad chamber
7. blaine — volcanic island research lab carved into magma cliffs
8. giovanni — regal Viridian earth gym, emerald direction tiles and stone terraces
9. lorelei — clear arctic pack-ice lake rimmed with deep indigo water

### 02

1. bruno — sandstone mountain martial-arts training yard
2. agatha — moonlit spirit garden and purple lanterns
3. lance — imperial crimson dragon pillar hall and reflecting pool
4. blue — Indigo Plateau gold champion chamber
5. johto-falkner — high wooden flying gym fight deck spanning clouds and windmills
6. johto-bugsy — tangled forest canopy bug gym clearing with bridge network
7. johto-whitney — Goldenrod cheery athletic garden court in pink and green
8. johto-morty — dark temple boardwalk lantern path over mist
9. johto-chuck — waterfall-side martial arts dojo, wet boulders and planks

### 03

1. johto-jasmine — steel gantry harbor dock
2. johto-pryce — crystalline frozen cave and ice maze
3. johto-clair — Blackthorn stone bridge high above lava
4. johto-will — violet mask theater of psychic light
5. johto-koga — hidden ninja bamboo training compound
6. johto-bruno — volcanic firelit martial training platform
7. johto-karen — elegant black and violet moonlight gallery
8. johto-lance — dragon sanctuary of Indigo Plateau surrounded by gold braziers
9. hoenn-roxanne — sandstone museum lit fossil skeleton display cases

### 04

1. hoenn-brawly — tropical surfing dojo on weathered timber with crashing waves
2. hoenn-wattson — powerhouse electric gates with green and gold coils
3. hoenn-flannery — volcanic hot-spring pools and steam terraces
4. hoenn-norman — Petalburg formal wooden training hall with sliding doors
5. hoenn-winona — treetop pivoting gates and broad canopy deck
6. hoenn-tate-liza — twins' sun and moon planetarium, telescope and golden brass orrery
7. hoenn-juan — Sootopolis white stone ice lake and blue cascades
8. hoenn-sidney — dark rock concert court in deep crimson sandstone
9. hoenn-phoebe — island spirit altar with flowers and blue lanterns

### 05

1. hoenn-glacia — icy arch colonnade
2. hoenn-drake — wooden sailing ship deck with masts and ocean at edges
3. hoenn-wallace — regal champion water amphitheater and cascading water
4. sinnoh-roark — subterranean coal mine with carts and industrial rails
5. sinnoh-gardenia — forest garden with flower clock and topiary
6. sinnoh-fantina — haunted velvet opera theater
7. sinnoh-maylene — Veilstone boxing gym, ringside punching bags and layered stands
8. sinnoh-wake — Pastoria marsh sluice works and water terraces
9. sinnoh-byron — industrial lift workshop and riveted platforms

### 06

1. sinnoh-candice — alpine snowball gym and broad clear ice
2. sinnoh-volkner — Sunyshore powerhouse of giant cogwheels
3. sinnoh-aaron — forest leaf clearing and giant trees
4. sinnoh-bertha — layered ochre sandstone canyon
5. sinnoh-flint — brick furnace fire court with embers
6. sinnoh-lucian — tall two-tier library with marquetry combat floor
7. sinnoh-cynthia — ancient black marble Sinnoh champion palace
8. unova-cheren — sunlit trainers school outdoor sports court
9. unova-roxie — underground punk club with amplifiers and teal/magenta stage lights

### 07

1. unova-burgh — elaborate silk cocoon art gallery and honeycomb alcoves
2. unova-elesa — electric fashion catwalk, white stage lights and bold magenta
3. unova-clay — underground mine lift and freight mechanisms
4. unova-skyla — jet wind-tunnel aircraft hangar
5. unova-drayden — monumental twin carved dragon statues
6. unova-marlon — tropical lily-pad docks with blue water
7. unova-shauntal — haunted spiral library with blue spirit fire
8. unova-grimsley — black marble midnight banquet ballroom
9. unova-caitlin — starry dream bedchamber, draped canopies and velvet

### 08

1. unova-marshal — cage-fighting ring and colored boxing ropes
2. unova-iris — fantastical dragon throne amongst stars
3. kalos-viola — dewy spider silk webs in a greenhouse ravine
4. kalos-grant — climbing gym with colorful holds on a cliff
5. kalos-korrina — warm wooden roller skating rink and curved banks
6. kalos-ramos — giant hollow tree gym and hanging vine decks
7. kalos-clemont — futuristic Prism Tower quiz hall, luminous golden and cyan machinery
8. kalos-valerie — pastel multi-storey dollhouse gym
9. kalos-olympia — breathtaking celestial planetarium of brass orbital rings and indigo galaxies

### 09

1. kalos-wulfric — rotating gym ice slabs and azure crystal planes
2. kalos-malva — Kalos Gothic fire chamber with towering flames
3. kalos-siebold — ornate palace floodgate room with rushing blue waterfalls
4. kalos-drasna — gothic twin dragon relief chamber
5. kalos-wikstrom — medieval steel vault and grilles
6. kalos-diantha — elegant white champion cathedral with stained glass
7. alola-gumshoos — lush tropical Verdant Cavern limestone clearing
8. alola-hala — Alolan village ceremonial timber platform and palms
9. alola-wishiwashi — Brooklet Hill terraced ponds, lilies and waterfalls

### 10

1. alola-salazzle — sunset volcanic basalt crater
2. alola-lurantis — Lush Jungle exotic flower meadow
3. alola-olivia — Alolan Ruins of Life stone altar with pink crystals
4. alola-vikavolt — mountaintop science observatory and large telescope
5. alola-mimikyu — haunted derelict supermarket floor and broken checkout shelving
6. alola-nanu — dark night harbor jetty, boats and lanterns
7. alola-hapu — ancient Poni Canyon monumental rock gate
8. alola-kommo-o — hidden dragon trial cave of scale-shaped mineral formations
9. alola-hala-elite — snowbound mountain fighting chamber and a ceremonial ring

### 11

1. alola-olivia-elite — mountaintop rock chamber with pink mineral columns
2. alola-acerola — mountain ghost chamber with floating blue spirit lantern flames
3. alola-kahili — bright high-mountain flying terrace and banners
4. alola-kukui — Lanakila highest mountain summit champion platform overlooking icy clouds
5. galar-milo — Milo vast country Galar grass stadium and green grandstands
6. galar-nessa — Nessa coastal water stadium with bright blue channels and splash gates
7. galar-kabu — Kabu industrial brick stadium with red furnace cauldrons
8. galar-bea — Bea bronze gym stadium with broad golden dojo mats
9. galar-opal — Opal enchanted forest theater, mushrooms and pink stage curtains

### 12

1. galar-gordie — rock climbing stadium surrounded by ochre terraces
2. galar-piers — Spikemuth neon street concert alley
3. galar-raihan — Hammerlocke fortress stadium with medieval dragon reliefs
4. galar-marnie — Wyndon gigantic tournament stadium opening, scarlet-and-black banners
5. galar-hop — Wyndon semifinals blue-and-white stadium in afternoon light
6. galar-bede — Bede's exhibition match, rose crystal lights and magenta stadium decorations
7. galar-nessa-cup — Nessa cup match, teal tide emblems and blue waterfront-inspired turf
8. galar-bea-cup — Bea cup match amber and black grandstands with ring designs
9. galar-raihan-cup — Raihan grand final arena with massive dragon banners and gold spotlights

### 13

1. galar-leon — Leon champion stadium regal purple and gold crown crest
2. paldea-katy — Cortondo olive orchard, sunlit terracotta and bakery ovens
3. paldea-brassius — Artazon sculpture plaza featuring a windmill, sculpted shapes and sunlit plants
4. paldea-iono — Levincia electric waterfront broadcast stage in teal and lemon
5. paldea-kofu — Cascarrafa whitewashed waterfall plaza with blue fountains
6. paldea-larry — Medali Treasury Eatery authentic Japanese restaurant counter, wooden pillars and recessed tournament floor
7. paldea-ryme — Montenevera snowy nighttime ghost concert stage with neon violet lights
8. paldea-tulip — Alfornada esplanade with colorful ceramic mosaic flooring
9. paldea-grusha — Glaseado snowfield ski court and alpine flags

### 14

1. paldea-rika — Paldea elite assessment room ivory architecture with earthen green accent panels
2. paldea-poppy — bright white Elite Four steel-type assessment room and yellow metal detailing
3. paldea-larry-elite — sky-blue flying themed modern assessment room with wind vanes
4. paldea-hassel — violet slate angular modern dragon assessment chamber
5. paldea-geeta — Geeta's sunlit rooftop court overlooking hills with blue glazed tiles and gold inlay
6. paldea-nemona — Nemona duel in circular Mesagoza plaza with a big multicolor type mosaic, Mediterranean storefronts
7. unused — alpine meadow
8. unused — village temple
9. unused — olive grove

## 개별 전장 보정

영원시티 체육관은 꽃시계를 북쪽 테라스에 배치한 별도 원화를 사용합니다. 중앙 통로의 꽃무늬는 돌 바닥과 높이가 같아 양쪽 포켓몬의 발과 공격 궤적이 자연스럽게 이어집니다. [영원시티 원화](overrides/sinnoh-gardenia.png)

황토마을 체육관은 높은 얼음벽을 링크 가장자리에 두고 중앙 미로를 얼음 아래에 새긴 별도 원화를 사용합니다. [황토마을 원화](overrides/johto-pryce.png)
