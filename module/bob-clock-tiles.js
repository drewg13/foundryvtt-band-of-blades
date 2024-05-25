import { BoBClock } from "./bob-clock.js";
import { log, error } from "./bob-clock-util.js";

const onClick = async () => {
  log('Tool Clicked');
  const clock = new BoBClock();
  const {clientWidth, clientHeight} = document.documentElement;
  const [cx, cy] = [clientWidth / 2, clientHeight / 2];
  const t = canvas.stage.worldTransform;
  const scale = canvas.stage.scale;
  const [vx, vy] = [(cx - t.tx) / scale.x, (cy - t.ty) / scale.y];
  const dim = {
    x: (vx - clock.image.widthTile),
    y: (vy - clock.image.heightTile)
  };

  const tile = new TileDocument({
    texture: { src: clock.image.texture.src },
    width: clock.image.widthTile,
    height: clock.image.heightTile,
    x: dim.x,
    y: dim.y,
    z: 900,
    rotation: 0,
    hidden: false,
    locked: false,
    flags: clock.flags
  });
  await canvas.scene.createEmbeddedDocuments("Tile", [tile]);
};

export default {
  getSceneControlButtons: (controls) => {
    const tiles = controls.find((c) => c.name === "tiles");
    tiles.tools.push({
      name: "clocks",
      title: "Clocks",
      icon: "fas fa-clock",
      onClick,
      button: true
    });
  },

  renderTileHUD: async (_hud, html, tileData) => {
    log("Render")
    let t = canvas.tiles.get( tileData._id ).document;

    if (!t?.flags['band-of-blades']?.clocks) {
      return false;
    }

    const button1HTML = await renderTemplate('systems/band-of-blades/templates/bob-clock-button1.html');
    const button2HTML = await renderTemplate('systems/band-of-blades/templates/bob-clock-button2.html');
    html.find("div.left").append(button1HTML).click(async (event) => {
      log("HUD Clicked")
      // re-get in case there has been an update
      let t = canvas.tiles.get( tileData._id ).document;

      const oldClock = new BoBClock(t.flags['band-of-blades']?.clocks);
      let newClock;

      const target = event.target.classList.contains("control-icon")
        ? event.target
        : event.target.parentElement;
      if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if ( target.dataset.action ) {
        return;
      } else {
        return error("ERROR: Unknown TileHUD Button");
      }
      await TileDocument.updateDocuments([{
        _id: t.id,
        texture: { src: newClock.image.texture.src },
        flags: newClock.flags
      }], {parent: canvas.scene});
    });

    html.find("div.right").append(button2HTML).click(async (event) => {
      log("HUD Clicked")
      // re-get in case there has been an update
      let t = canvas.tiles.get( tileData._id ).document;

      const oldClock = new BoBClock(t.flags['band-of-blades']?.clocks);
      let newClock;

      const target = event.target.classList.contains("control-icon")
        ? event.target
        : event.target.parentElement;
      if (target.classList.contains("progress-up")) {
        newClock = oldClock.increment();
      } else if (target.classList.contains("progress-down")) {
        newClock = oldClock.decrement();
      } else if ( target.dataset.action ) {
        return;
      } else {
        return error("ERROR: Unknown TileHUD Button");
      }
      await TileDocument.updateDocuments([{
        _id: t.id,
        texture: { src: newClock.image.texture.src },
        flags: newClock.flags
      }], {parent: canvas.scene});
    });
  }
};
