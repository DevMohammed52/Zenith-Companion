# IdleMMO Teleportation & Travel Distance Calibration

Last Updated: October 27, 2026

## 1. Verified Character Test Cases

| Character | Hashed ID | Class | Gross TL | Exempt Skills | Economic TL | Origin | Destination | Distance | Displayed Cost | Calculated Slope $S$ | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D3vxGh0st** | `D3vxGh0st` | Angler | 1,929 | Springtide (89), Shadow (88), Lunar (86), Guild (87), Yule (89), Meditation (100+) | ~1,390 | Wraithwood Forest | The Citadel | 38,200m | 1,732g | 3.30236 | 10 routes verified |
| **TimestoNut** | `Zbym56qLxmbP1QBRp7Ee` | Beastmaster | 286 | None | 286 | Skyreach Peak | The Citadel | 30,009m | 85g | 0.08747 | Low-bracket anchor |
| **TimestoCut** | `o31P7kZL62a16LveGxXO` | Beastmaster | 331 | None | 331 | Wraithwood Forest | The Citadel | 38,200m | 110g | 0.11780 | Low-bracket anchor |
| **Rokukyu** | `ZvrGV8RQpvel6Y2wgA5j` | Unknown | ~565 | - | ~565 | Skyreach Peak | Isle of Whispers | 47,304m | 593g | 0.86092 | Mid-bracket anchor |
| **MereCombatOnly** | `jlPA8v9NMg7r8LEyMe2O` | Combat Only | 865 | 0 (pure combat) | 865 | Wraithwood Forest | Enchanted Oasis | 41,632m | 1,016g | 1.74020 | Pure combat baseline |

---

## 2. All 10 Routes from Wraithwood Forest (D3vxGh0st - Econ TL 1390)

| Destination | Verified In-Game Distance | Displayed Cost | Variable Cost | Variable Slope $S$ |
| :--- | :--- | :--- | :--- | :--- |
| **Bluebell Hollow** | 13,547m | 646g | 596g | 3.29962 |
| **Whispering Woods** | 14,835m | 703g | 653g | 3.30131 |
| **Eldoria** | 12,146m | 584g | 534g | 3.29738 |
| **Crystal Caverns** | 29,262m | 1,338g | 1,288g | 3.30121 |
| **Skyreach Peak** | 42,002m | 1,900g | 1,850g | 3.30341 |
| **Enchanted Oasis** | 41,632m | 1,883g | 1,833g | 3.30215 |
| **Floating Gardens** | 15,098m | 715g | 665g | 3.30342 |
| **Celestial Observatory** | 41,603m | 1,882g | 1,832g | 3.30265 |
| **Isle of Whispers** | 21,676m | 1,004g | 954g | 3.30089 |
| **The Citadel** | 38,200m | 1,732g | 1,682g | 3.30236 |

**Mean Slope at Econ TL 1,390**: $S = 3.30144$

---

## 3. World Coordinate Map Geometry

Every measured in-game distance matches Euclidean 2D distance with scalar factor $75\text{m}$:

$$\text{Distance} = \text{round}\left(\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} \times 75\right)$$

* **Bluebell Hollow**: $(180, 100)$
* **Whispering Woods**: $(500, 150)$
* **Eldoria**: $(290, 380)$
* **Crystal Caverns**: $(650, 420)$
* **Skyreach Peak**: $(800, 500)$
* **Enchanted Oasis**: $(240, 770)$
* **Floating Gardens**: $(120, 270)$
* **Celestial Observatory**: $(575, 710)$
* **Isle of Whispers**: $(170, 470)$
* **The Citadel**: $(810, 100)$
* **Wraithwood Forest**: $(315, 220)$

---

## 4. Canonical Exempt Skills

Per the official IdleMMO Wiki, the 6 skills excluded from economic teleport level calculation are:
1. `Springtide Mastery`
2. `Shadow Mastery`
3. `Lunar Mastery`
4. `Guild Mastery`
5. `Yule Mastery`
6. `Meditation`
