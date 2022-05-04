/* eslint-disable tsdoc/syntax -- JSX pragma commands */
/** @jsx Adobe.Element */
/** @jsxFrag Adobe.Fragment */
/* eslint-enable tsdoc/syntax -- JSX pragma commands */
/* global Adobe: readonly -- Declared by the managed-ui.ts runtime */
/* global hz: readonly -- Declared by the async.ts plugin runtime */

//let colorRGBA = "#73218ccc";
let colorRGBA = "#3826a8ccc";
let numPetals = 15;
let centerDiameter = 110;
let minOuterDiameter = centerDiameter + 1;
let outerDiameter = 278;
let maxCenterDiameter = outerDiameter - 1;

let centerCircle = null;
let petals = null;
const center = { x: 0, y: 0 };

function onColor({ detail }) {
  colorRGBA = detail.value;
  updatePetals();
}

async function onNumPetals({ target }) {
  const lastNumPetals = numPetals;
  numPetals = await target.get("value");
  if (!petals) return;

  if (numPetals < lastNumPetals) {
    for (let i = numPetals; i < lastNumPetals; ++i) {
      petals[i].remove();
    }
  } else if (lastNumPetals < numPetals) {
    const numExisting = petals.length;
    for (
      let i = lastNumPetals, n = Math.min(numExisting, numPetals);
      i < n;
      ++i
    ) {
      petals[i].place();
    }
    if (numExisting < numPetals) {
      petals.splice(
        -1,
        0,
        ...Array.from(
          Array(numPetals - numExisting),
          () => new hz.canvas.Ellipse()
        )
      );
    }
  }

  updatePetals();
}

async function onCenterDiameter({ target }) {
  centerDiameter = await target.get("value");
  minOuterDiameter = centerDiameter + 1;
  outerDiameter = Math.max(outerDiameter, minOuterDiameter);
  updatePetals();
  render();
}

async function onOuterDiameter({ target }) {
  outerDiameter = await target.get("value");
  maxCenterDiameter = outerDiameter - 1;
  centerDiameter = Math.min(centerDiameter, maxCenterDiameter);
  updatePetals();
  render();
}

async function createPetals() {
  // TODO move to plugin SDK
  const geo = await Adobe.canvasGeometry();
  center.x = geo.x + geo.width / 2;
  center.y = geo.y + geo.height / 2;

  centerCircle = new hz.canvas.Ellipse();
  centerCircle.fill = { type: "color", color: { argb: 0xffdcbc00 } };
  petals = Array.from(Array(numPetals), () => new hz.canvas.Ellipse());
  updatePetals();
}

async function updatePetals() {
  const innerRadius = centerDiameter / 2;
  const size = outerDiameter - innerRadius;
  const rx = size / 2;
  const petalOffset = innerRadius + rx;
  const ry = (Math.PI * petalOffset) / numPetals;
  const color = parseColorStr(colorRGBA);

  const { x, y } = center;

  const centerCircleRadius = innerRadius + 30;
  centerCircle.geometry = { rx: centerCircleRadius, ry: centerCircleRadius };
  centerCircle.transform = {
    x: x - centerCircleRadius,
    y: y - centerCircleRadius,
  };

  petals.forEach((petal, i) => {
    const turns = i / numPetals;
    const radians = 2 * Math.PI * turns;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);

    petal.transform = {
      x: x - rx + cos * petalOffset + (1 - cos) * rx + sin * ry,
      y: y - ry + sin * petalOffset + (1 - cos) * ry - sin * rx,
      rotation: 360 * turns,
    };
    petal.geometry = { rx, ry };
    petal.fill = { type: "color", color };
  });
}

hz.ready.then(render);

function render() {
  Adobe.render(
    <>
      <style>{styles}</style>
      <hz-color-picker
        color={colorRGBA}
        editable
        label="Fill Color"
        onchange={onColor}
        variant="square"
        wellType="fill"
      />
      <sp-slider
        label="Petals"
        onInput={onNumPetals}
        value={numPetals}
        min={5}
        max={27}
        step={2}
      />
      <sp-slider
        label="Center Size"
        onInput={onCenterDiameter}
        value={centerDiameter}
        min={0}
        max={maxCenterDiameter}
        formatOptions={pixelFormat}
      />
      <sp-slider
        label="Diameter"
        onInput={onOuterDiameter}
        value={outerDiameter}
        min={centerDiameter + 1}
        max={720}
        formatOptions={pixelFormat}
      />

      <div class="buttons">
        <sp-button variant="cta" onClick={createPetals}>
          Create
        </sp-button>
      </div>
    </>
  );
}

const styles = `
:host {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: var(--spectrum-global-dimension-size-200);
}

:host > * {
    width: 100%;
}

.buttons {
    align-self: center;
    width: fit-content;
}
`;

const pixelFormat = { style: "unit", unit: "px", unitDisplay: "narrow" };

function parseColorStr(colorStr) {
  const match = /[0-9a-f]+/i.exec(colorStr);
  if (!match) return undefined;
  const [r, g, b, a] = match[0]
    .split(/(?=(?:..)+$)/)
    .map((x) => parseInt(x, 16));
  return { argb: ((a << 24) | (r << 16) | (g << 8) | b) >>> 0 };
}
