# 팔데아 본토의 야생 포켓몬

《포켓몬스터스칼렛》 본편을 기준으로 티스푼 오솔길, 동서남북의 15개 에리어, 네 바다와 산·숲·동굴을 구분한다. 스칼렛에서 야생으로 등장하는 버전 한정 포켓몬을 사용한다. 원작은 같은 장소에서도 지형, 위치, 시간대에 따라 무리를 생성한다. 데스크톱에서는 지도에서 고른 장소 전체를 단위로 한 마리씩 만난다. [원작 필드 출현 데이터](https://github.com/XLuma/SV-Randomizer/blob/3c28a5c9485b37cf858d5c1254dfe8867790a11b/Randomizer/WildEncounters/pokedata_array_clean.json) · [필드 데이터의 항목 정의](https://github.com/kwsch/pkNX/blob/3bc649eea311ab1f249af43a562f8d70fe90ed9b/FlatBuffers/SV/World/Schemas/EncountPokeDataArray.fbs)

## 산책 출현율과 레벨

32개 원작 지명의 일반 야생 데이터를 사용한다. 에리어 제로를 지상과 동굴로 나누어 지도에서는 33곳에서 일반 포켓몬 325종을 만날 수 있다. 장소·종·폼별 레코드는 2,568개이며, 같은 종과 레벨을 합친 위치·종·레벨 조합은 13,782개다. 원작 슬롯에서 경계 너머로 걸어 들어올 수 있는 포켓몬은 해당 장소의 일반 출현에 포함하지 않았다.

지형별 출현 가중치를 그 장소에서 해당 지형이 차지하는 비중과 하루 동안 활동하는 시간대의 비율로 합산한다. 산책을 시작하면 장소별 상대 가중치로 포켓몬을 뽑고, 해당 폼의 원작 허용 레벨 안에서 균등하게 레벨을 정한다. 지형 비율 자료가 없는 곳에는 대체 가중치를 쓴다. 원작의 개별 좌표, 무리 규모, 샌드위치 효과와 데스크톱의 시각은 산책 확률 계산에서 생략했다. [원작 슬롯 추출 코드](https://github.com/kwsch/pkNX/blob/3bc649eea311ab1f249af43a562f8d70fe90ed9b/pkNX.WinForms/Dumping/Gen9/Encounter/EncounterSlotDumper9.cs) · [장소별 지형 비율](https://github.com/adough1085/Encounter-Generator/tree/a664a324169cfe32f0f2ac9524fe657fdb955a67/backend/data/probability_insert)

## 장소와 모습

티스푼 오솔길에서는 Lv.2~4의 맛보돈과 빠모를 만난다. 남부 에리어 1에는 팔데아 우파가 산다. 동부 에리어 2에서 팔데아 켄타로스의 컴뱃종은 Lv.22부터, 블레이즈종은 Lv.25부터 등장한다. 오야 호수에서는 싸리용의 세 가지 모습을 만날 수 있다. 지역과 레벨별 출현 가능 여부는 팔데아의 위치·종·폼·레벨 범위를 기록한 자료와 대조했다. [팔데아 장소별 원본 슬롯](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Resources/legality/wild/Gen9/encounter_wild_paldea.pkl) · [슬롯 해석 코드](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Legality/Encounters/Templates/Gen9/EncounterArea9.cs)

## 사당과 에리어 제로

| 장소 | 특별 조우 | 레벨 | 데스크톱 해금 조건 |
| --- | --- | --- | --- |
| 후목의 사당 | 총지엔 | 60 | 팔데아 체육관 배지 8개 |
| 동파의 사당 | 파오젠 | 60 | 팔데아 체육관 배지 8개 |
| 진토의 사당 | 딩루 | 60 | 팔데아 체육관 배지 8개 |
| 화마의 사당 | 위유이 | 60 | 팔데아 체육관 배지 8개 |
| 제로랩 | 코라이돈 | 72 | 포켓몬리그 우승 후 테이블시티에서 네모에게 승리 |

해금된 해당 위치에서 야생 출현을 판정할 때마다 전설의 포켓몬을 뽑을 확률은 0.65%다. 원작의 네 봉인에 대응하는 데스크톱 해금 조건은 팔데아 배지 8개다. 에리어 제로와 지하 동굴에는 스칼렛의 고대 패러독스 포켓몬이 등장한다. 제로랩의 코라이돈은 원작에서 포획하는 두 번째 개체의 레벨을 따른다. [스칼렛·바이올렛 고정 조우 표](https://github.com/kwsch/PKHeX/blob/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/Legality/Encounters/Data/Gen9/Encounters9.cs) · [닌텐도의 팔데아 모험 소개](https://www.nintendo.com/sg/news/article/BiqQ9HVi2ai7dxsC0fHiM)
