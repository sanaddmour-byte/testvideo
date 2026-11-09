// Pure data for the look-development frames (also read by scripts/validate.ts).
export const lookLayerKeys = ["FB.cushion_layer", "FB.thickness"];

export const LOOK_BARS = {
  products: ["FB", "FB-S"],
  props: [
    { key: "tensile", axisMax: 1200 },
    { key: "tear", axisMax: 600 },
    { key: "water_tightness", axisMax: 800 },
    { key: "crack_bridging", axisMax: 4 },
  ],
};
export const lookBarsKeys = LOOK_BARS.products.flatMap((p) => LOOK_BARS.props.map((q) => `${p}.${q.key}`));

export const LOOK_TABLE = {
  products: ["REPCOAT", "REPCOAT-FF", "REPCOAT-FF-PLUS"],
  rows: [
    { prop: "coverage", cells: ["REPCOAT.coverage", "REPCOAT-FF.coverage", "REPCOAT-FF-PLUS.coverage"] },
    { prop: "recoat", cells: ["REPCOAT.recoat", "REPCOAT-FF.recoat", "REPCOAT-FF-PLUS.recoat"] },
    { prop: "carbonation", cells: ["REPCOAT.carbonation_depth", "REPCOAT-FF.carbonation_resistance", "REPCOAT-FF-PLUS.carbonation_resistance"] },
    { prop: "voc", cells: ["REPCOAT.voc", "REPCOAT-FF.voc", "REPCOAT-FF-PLUS.voc"] },
  ],
};
export const lookTableKeys = LOOK_TABLE.rows.flatMap((r) => r.cells);
