import React from "react";
import { useCurrentFrame } from "remotion";
import { SceneFrame } from "./components/SceneFrame";
import { LayerStack } from "./components/LayerStack";
import { DetailCallout } from "./components/DetailCallout";
import { ComparisonBars } from "./components/ComparisonBars";
import { ComparisonTable } from "./components/ComparisonTable";
import { SelectorMatrix } from "./components/SelectorMatrix";
import { DataPending } from "./components/DataPending";
import { brand, colorOf, type } from "./theme/brand";
import { fills } from "./components/Patterns";
import { selector } from "./data/selector";
import { useT } from "./i18n";
import { content } from "./theme/layout";
import { LOOK_BARS, LOOK_TABLE, lookBarsKeys, lookLayerKeys, lookTableKeys } from "./specs/lookdev";

/** Look-development frames: one per reusable component, using real data keys. Not part of the master. */

export const LookLayers: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <SceneFrame title={t("lookdev.layers")} subtitle="DonProof FB — pre-applied, below-grade" footKeys={lookLayerKeys}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <LayerStack frame={f} x={160} y={240} width={620} every={30}
          layers={[
            { label: "Blinding concrete / compacted sand", fill: fills.concrete, h: 130 },
            { label: "Geotextile cushion layer", fill: "#E8E2D2", h: 56, dataKey: "FB.cushion_layer", hatch: true },
            { label: "DonProof FB membrane", fill: colorOf("FB"), h: 56, dataKey: "FB.thickness" },
            { label: "Structural concrete (cast against membrane)", fill: fills.concrete, h: 150 },
          ]} noteNotToScale="Schematic — not to scale" />
      </svg>
      <DetailCallout n={1} pin={[700, 560]} box={[1180, 800]} width={560} text="A 20 mm fillet should be formed at the base" frame={f} start={150} source="Method Statement, DCP00/08-0199/0200-A-2025, NOT STATED" />
    </SceneFrame>
  );
};

export const LookBars: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <SceneFrame title={t("lookdev.bars")} subtitle="FB vs FB-S — identical test standards" footKeys={lookBarsKeys}>
      <ComparisonBars products={LOOK_BARS.products} props={LOOK_BARS.props} frame={f} start={4} x={content.left} y={230} width={1500} />
    </SceneFrame>
  );
};

export const LookTable: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const P = LOOK_TABLE.products;
  return (
    <SceneFrame title={t("lookdev.table")} subtitle="Repcoat · Repcoat FF · Repcoat FF Plus" footKeys={lookTableKeys}>
      <ComparisonTable products={P} frame={f} start={4} x={content.left} y={220} width={1728}
        rows={LOOK_TABLE.rows} />
      <div style={{ position: "absolute", right: content.left, top: 140, fontSize: type.body, display: "flex", gap: 18, alignItems: "center" }}>
        <DataPending /> <span style={{ color: brand.muted }}>= no value in the TDS</span>
      </div>
    </SceneFrame>
  );
};

export const LookMatrix: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  return (
    <SceneFrame title={t("lookdev.matrix")} subtitle="Tick only where the TDS lists the use" logo>
      <SelectorMatrix rows={selector.slice(0, 11)} frame={f} start={2} x={content.left} y={200} width={1728} highlightZone="B" />
    </SceneFrame>
  );
};
