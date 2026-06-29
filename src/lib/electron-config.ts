/**
 * Element data for "Electron Configuration & Period/Group Determination" lab.
 * First 30 elements (H → Zn) with Bohr shell counts and sub-shell notation.
 */

export type Block = "s" | "p" | "d";

export type Element = {
  Z: number;
  symbol: string;
  name: string;     // English
  nameBn: string;   // বাংলা
  shells: number[]; // K, L, M, N (Bohr)
  config: string;   // full sub-shell config e.g. "1s2 2s2 2p6 3s1"
  noble?: string;   // noble gas core symbol e.g. "Ne", "Ar"
  shortConfig?: string; // with noble-gas core e.g. "[Ne] 3s1"
  group: number;    // 1..18
  period: number;   // 1..4
  block: Block;
  valence: number;  // outer-shell electrons (s+p) for main-group;
                    // for d-block we use ns + (n-1)d for group rule
  dCount?: number;  // d-electrons (n-1)d^x for d-block
  category:
    | "nonmetal"
    | "noble"
    | "alkali"
    | "alkaline"
    | "metalloid"
    | "post-transition"
    | "transition"
    | "halogen";
};

export const ELEMENTS: Element[] = [
  { Z:1,  symbol:"H",  name:"Hydrogen",   nameBn:"হাইড্রোজেন",   shells:[1],            config:"1s1",                              group:1,  period:1, block:"s", valence:1, category:"nonmetal" },
  { Z:2,  symbol:"He", name:"Helium",     nameBn:"হিলিয়াম",     shells:[2],            config:"1s2",                              group:18, period:1, block:"s", valence:2, category:"noble" },
  { Z:3,  symbol:"Li", name:"Lithium",    nameBn:"লিথিয়াম",     shells:[2,1],          config:"1s2 2s1",                          noble:"He", shortConfig:"[He] 2s1", group:1,  period:2, block:"s", valence:1, category:"alkali" },
  { Z:4,  symbol:"Be", name:"Beryllium",  nameBn:"বেরিলিয়াম",   shells:[2,2],          config:"1s2 2s2",                          noble:"He", shortConfig:"[He] 2s2", group:2,  period:2, block:"s", valence:2, category:"alkaline" },
  { Z:5,  symbol:"B",  name:"Boron",      nameBn:"বোরন",         shells:[2,3],          config:"1s2 2s2 2p1",                      noble:"He", shortConfig:"[He] 2s2 2p1", group:13, period:2, block:"p", valence:3, category:"metalloid" },
  { Z:6,  symbol:"C",  name:"Carbon",     nameBn:"কার্বন",       shells:[2,4],          config:"1s2 2s2 2p2",                      noble:"He", shortConfig:"[He] 2s2 2p2", group:14, period:2, block:"p", valence:4, category:"nonmetal" },
  { Z:7,  symbol:"N",  name:"Nitrogen",   nameBn:"নাইট্রোজেন",   shells:[2,5],          config:"1s2 2s2 2p3",                      noble:"He", shortConfig:"[He] 2s2 2p3", group:15, period:2, block:"p", valence:5, category:"nonmetal" },
  { Z:8,  symbol:"O",  name:"Oxygen",     nameBn:"অক্সিজেন",     shells:[2,6],          config:"1s2 2s2 2p4",                      noble:"He", shortConfig:"[He] 2s2 2p4", group:16, period:2, block:"p", valence:6, category:"nonmetal" },
  { Z:9,  symbol:"F",  name:"Fluorine",   nameBn:"ফ্লোরিন",       shells:[2,7],          config:"1s2 2s2 2p5",                      noble:"He", shortConfig:"[He] 2s2 2p5", group:17, period:2, block:"p", valence:7, category:"halogen" },
  { Z:10, symbol:"Ne", name:"Neon",       nameBn:"নিয়ন",         shells:[2,8],          config:"1s2 2s2 2p6",                      noble:"He", shortConfig:"[He] 2s2 2p6", group:18, period:2, block:"p", valence:8, category:"noble" },
  { Z:11, symbol:"Na", name:"Sodium",     nameBn:"সোডিয়াম",     shells:[2,8,1],        config:"1s2 2s2 2p6 3s1",                  noble:"Ne", shortConfig:"[Ne] 3s1", group:1,  period:3, block:"s", valence:1, category:"alkali" },
  { Z:12, symbol:"Mg", name:"Magnesium",  nameBn:"ম্যাগনেসিয়াম", shells:[2,8,2],        config:"1s2 2s2 2p6 3s2",                  noble:"Ne", shortConfig:"[Ne] 3s2", group:2,  period:3, block:"s", valence:2, category:"alkaline" },
  { Z:13, symbol:"Al", name:"Aluminium",  nameBn:"অ্যালুমিনিয়াম", shells:[2,8,3],        config:"1s2 2s2 2p6 3s2 3p1",              noble:"Ne", shortConfig:"[Ne] 3s2 3p1", group:13, period:3, block:"p", valence:3, category:"post-transition" },
  { Z:14, symbol:"Si", name:"Silicon",    nameBn:"সিলিকন",       shells:[2,8,4],        config:"1s2 2s2 2p6 3s2 3p2",              noble:"Ne", shortConfig:"[Ne] 3s2 3p2", group:14, period:3, block:"p", valence:4, category:"metalloid" },
  { Z:15, symbol:"P",  name:"Phosphorus", nameBn:"ফসফরাস",       shells:[2,8,5],        config:"1s2 2s2 2p6 3s2 3p3",              noble:"Ne", shortConfig:"[Ne] 3s2 3p3", group:15, period:3, block:"p", valence:5, category:"nonmetal" },
  { Z:16, symbol:"S",  name:"Sulfur",     nameBn:"সালফার",       shells:[2,8,6],        config:"1s2 2s2 2p6 3s2 3p4",              noble:"Ne", shortConfig:"[Ne] 3s2 3p4", group:16, period:3, block:"p", valence:6, category:"nonmetal" },
  { Z:17, symbol:"Cl", name:"Chlorine",   nameBn:"ক্লোরিন",       shells:[2,8,7],        config:"1s2 2s2 2p6 3s2 3p5",              noble:"Ne", shortConfig:"[Ne] 3s2 3p5", group:17, period:3, block:"p", valence:7, category:"halogen" },
  { Z:18, symbol:"Ar", name:"Argon",      nameBn:"আর্গন",         shells:[2,8,8],        config:"1s2 2s2 2p6 3s2 3p6",              noble:"Ne", shortConfig:"[Ne] 3s2 3p6", group:18, period:3, block:"p", valence:8, category:"noble" },
  { Z:19, symbol:"K",  name:"Potassium",  nameBn:"পটাশিয়াম",     shells:[2,8,8,1],      config:"1s2 2s2 2p6 3s2 3p6 4s1",          noble:"Ar", shortConfig:"[Ar] 4s1", group:1,  period:4, block:"s", valence:1, category:"alkali" },
  { Z:20, symbol:"Ca", name:"Calcium",    nameBn:"ক্যালসিয়াম",   shells:[2,8,8,2],      config:"1s2 2s2 2p6 3s2 3p6 4s2",          noble:"Ar", shortConfig:"[Ar] 4s2", group:2,  period:4, block:"s", valence:2, category:"alkaline" },
  { Z:21, symbol:"Sc", name:"Scandium",   nameBn:"স্ক্যান্ডিয়াম", shells:[2,8,9,2],      config:"1s2 2s2 2p6 3s2 3p6 3d1 4s2",      noble:"Ar", shortConfig:"[Ar] 3d1 4s2",  group:3,  period:4, block:"d", valence:2, dCount:1, category:"transition" },
  { Z:22, symbol:"Ti", name:"Titanium",   nameBn:"টাইটেনিয়াম",   shells:[2,8,10,2],     config:"1s2 2s2 2p6 3s2 3p6 3d2 4s2",      noble:"Ar", shortConfig:"[Ar] 3d2 4s2",  group:4,  period:4, block:"d", valence:2, dCount:2, category:"transition" },
  { Z:23, symbol:"V",  name:"Vanadium",   nameBn:"ভ্যানাডিয়াম",   shells:[2,8,11,2],     config:"1s2 2s2 2p6 3s2 3p6 3d3 4s2",      noble:"Ar", shortConfig:"[Ar] 3d3 4s2",  group:5,  period:4, block:"d", valence:2, dCount:3, category:"transition" },
  { Z:24, symbol:"Cr", name:"Chromium",   nameBn:"ক্রোমিয়াম",     shells:[2,8,13,1],     config:"1s2 2s2 2p6 3s2 3p6 3d5 4s1",      noble:"Ar", shortConfig:"[Ar] 3d5 4s1",  group:6,  period:4, block:"d", valence:1, dCount:5, category:"transition" },
  { Z:25, symbol:"Mn", name:"Manganese",  nameBn:"ম্যাঙ্গানিজ",   shells:[2,8,13,2],     config:"1s2 2s2 2p6 3s2 3p6 3d5 4s2",      noble:"Ar", shortConfig:"[Ar] 3d5 4s2",  group:7,  period:4, block:"d", valence:2, dCount:5, category:"transition" },
  { Z:26, symbol:"Fe", name:"Iron",       nameBn:"আয়রন",         shells:[2,8,14,2],     config:"1s2 2s2 2p6 3s2 3p6 3d6 4s2",      noble:"Ar", shortConfig:"[Ar] 3d6 4s2",  group:8,  period:4, block:"d", valence:2, dCount:6, category:"transition" },
  { Z:27, symbol:"Co", name:"Cobalt",     nameBn:"কোবাল্ট",       shells:[2,8,15,2],     config:"1s2 2s2 2p6 3s2 3p6 3d7 4s2",      noble:"Ar", shortConfig:"[Ar] 3d7 4s2",  group:9,  period:4, block:"d", valence:2, dCount:7, category:"transition" },
  { Z:28, symbol:"Ni", name:"Nickel",     nameBn:"নিকেল",         shells:[2,8,16,2],     config:"1s2 2s2 2p6 3s2 3p6 3d8 4s2",      noble:"Ar", shortConfig:"[Ar] 3d8 4s2",  group:10, period:4, block:"d", valence:2, dCount:8, category:"transition" },
  { Z:29, symbol:"Cu", name:"Copper",     nameBn:"কপার",           shells:[2,8,18,1],     config:"1s2 2s2 2p6 3s2 3p6 3d10 4s1",     noble:"Ar", shortConfig:"[Ar] 3d10 4s1", group:11, period:4, block:"d", valence:1, dCount:10, category:"transition" },
  { Z:30, symbol:"Zn", name:"Zinc",       nameBn:"জিংক",           shells:[2,8,18,2],     config:"1s2 2s2 2p6 3s2 3p6 3d10 4s2",     noble:"Ar", shortConfig:"[Ar] 3d10 4s2", group:12, period:4, block:"d", valence:2, dCount:10, category:"transition" },
];

export const ELEMENT_BY_Z = new Map(ELEMENTS.map((e) => [e.Z, e]));

/** Highest principal quantum number from sub-shell config (period). */
export function highestN(el: Element): number {
  return el.period;
}

/** Group determination rule (text + value). */
export function groupRule(el: Element): { rule: string; ruleBn: string; calc: string } {
  if (el.block === "d") {
    const x = el.dCount ?? 0;
    const s = el.valence; // ns electrons
    // Standard simplified rule (Cr/Cu exceptions noted): group = d + s
    return {
      rule: `d-block: Group = (n−1)d^${x} + ns^${s} = ${x + s}`,
      ruleBn: `d-ব্লক: গ্রুপ = (n−1)d^${x} + ns^${s} = ${x + s}`,
      calc: `${x} + ${s} = ${x + s}`,
    };
  }
  if (el.valence <= 2) {
    return {
      rule: `s-block: Group = valence = ${el.valence}`,
      ruleBn: `s-ব্লক: গ্রুপ = যোজ্যতা ইলেকট্রন = ${el.valence}`,
      calc: `${el.valence}`,
    };
  }
  // p-block (valence 3..8 → groups 13..18); helium is the exception above.
  return {
    rule: `p-block: Group = valence + 10 = ${el.valence} + 10 = ${el.valence + 10}`,
    ruleBn: `p-ব্লক: গ্রুপ = যোজ্যতা + ১০ = ${el.valence} + ১০ = ${el.valence + 10}`,
    calc: `${el.valence} + 10 = ${el.valence + 10}`,
  };
}

/** Bohr shell capacities (informative). */
export const SHELL_CAPACITY = [2, 8, 18, 32];
export const SHELL_NAMES = ["K", "L", "M", "N"];
