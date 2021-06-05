import { BoBClock } from "./bob-clock.js";
import { log, error } from "./bob-clock-util.js";

const onClick = async () => {
  log('Tool Clicked');
  const clock = new BoBClock();
  const dim = {
    x: ((canvas.dimensions.sceneRect.width - clock.image.widthTile) / 2) + canvas.dimensions.paddingX,
    y: ((canvas.dimensions.sceneRect.height - clock.image.heightTile) / 2) + canvas.dimensions.paddingY
  };

  const tile = new TileDocument({
    img: clock.image.img,
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
  await canvas.scene.createEmbeddedDocuments("Tile", [tile.data]);
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
    let t;
    let b = canvas.background.tiles.find( tile => tile.id === tileData._id );
    let f = canvas.foreground.tiles.find( tile => tile.id === tileData._id );
    if( b?.id === tileData._id ) {
      t = b;
    } else if ( f?.id === tileData._id ) {
      t = f;
    } else { return false }

    if (!t?.data?.flags['band-of-blades']?.clocks) {
      return false;
    }

    const buttonHTML = await renderTemplate('systems/band-of-blades/templates/bob-clock-buttons.html');
    html.find("div.right").append(buttonHTML).click(async (event) => {
      log("HUD Clicked")
      // re-get in case there has been an update
      b = canvas.background.tiles.find( tile => tile.id === tileData._id );
      f = canvas.foreground.tiles.find( tile => tile.id === tileData._id );
      if( b?.id === tileData._id ) {
        t = b;
      } else if ( f?.id === tileData._id ) {
        t = f;
      }

      const oldClock = new BoBClock(t.data.flags['band-of-blades'].clocks);
      let newClock;

      const target = event.target.classList.contains("control-icon")
        ? event.target
        : event.target.parentElement;
      if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if (target.classList.contains("progress-up")) {
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
        img: newClock.image.img,
        flags: newClock.flags
      }], {parent: canvas.scene});
    });
  }
};
