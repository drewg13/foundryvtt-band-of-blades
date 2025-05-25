import { BoBClock } from "./bob-clock.js";
import { getSystemMapping } from "./systems/index.js";
import { log, error } from "./bob-clock-util.js";

const DISPLAY_NAME = {
  ALWAYS_FOR_EVERYONE: 50
};
const DISPOSITION = {
  NEUTRAL: 0
};
const DEFAULT_TOKEN = {
  disposition: DISPOSITION.NEUTRAL,
  displayName: DISPLAY_NAME.ALWAYS_FOR_EVERYONE,
  actorLink: true
};

export class BoBClockSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    const supportedSystem = getSystemMapping(game.system.id);
    return foundry.utils.mergeObject(
      super.defaultOptions,
      {
        classes: ["clocks", "sheet", `clocks-system-${game.system.id}`, "actor", "npc"],
        template: "systems/band-of-blades/templates/bob-clock-sheet.html",
        width: 360,
        height: 550,
        ...supportedSystem.sheetDefaultOptions
      }
    );
  }

/*  static register () {
    const supportedSystem = getSystemMapping(game.data.system.id);
    Actors.registerSheet(supportedSystem.id, ClockSheet, supportedSystem.registerSheetOptions);
    log("Sheet Registered");
  }
*/
  constructor (...args) {
    super(...args);
    this._system = getSystemMapping(game.system.id);
  }

  get system () {
    return this._system;
  }

  getData (options) {
    let clock = new BoBClock(this.system.loadClockFromActor({ actor: this.document }));
    const sizesObject = {};
    BoBClock.sizes.forEach((item) => {
      sizesObject[item] = String(item);
    });
    const themesObject = {};
    BoBClock.themes.forEach((item) => {
      themesObject[item] = String(item);
    });
    const data = foundry.utils.mergeObject(super.getData(options), {
      clock: {
        progress: clock.progress,
        size: String(clock.size),
        theme: clock.theme,
        image: {
          url: clock.image.texture.src,
          width: clock.image.widthSheet,
          height: clock.image.heightSheet
        },
        settings: {
          sizes: sizesObject,
          themes: themesObject
        },
        flags: clock.flags
      }
    });
    data.editable = data.options.editable;
    return data;
  }

  activateListeners (html) {
    super.activateListeners(html);

    html.find("button[name=minus]").click(async (ev) => {
      ev.preventDefault();
      let oldClock = new BoBClock(this.system.loadClockFromActor({ actor: this.document }));
      await this.updateClock(oldClock.decrement());
    });

    html.find("button[name=plus]").click(async (ev) => {
      ev.preventDefault();
      let oldClock = new BoBClock(this.system.loadClockFromActor({ actor: this.document }));
      await this.updateClock(oldClock.increment());
    });

    html.find("button[name=reset]").click(async (ev) => {
      ev.preventDefault();
      let oldClock = new BoBClock(this.system.loadClockFromActor({ actor: this.document }));
      await this.updateClock(new BoBClock({
        theme: oldClock.theme,
        progress: 0,
        size: oldClock.size
      }));
    });
  }

  async _updateObject(_event, form) {
    await this.object.update({
      name: form.name
    });
    let oldClock = new BoBClock(this.system.loadClockFromActor({ actor: this.document }));
    let newClock = new BoBClock({
      progress: oldClock.progress,
      size: form.size,
      theme: form.theme
    });
    await this.updateClock(newClock);
  }

  async updateClock(clock) {
    let actor = this.document;

    // update associated tokens
    const tokens = actor.getActiveTokens();
    if( tokens.length !== 0 ) {
      let update = [];
      let tokenObj = {};
      for( const t of tokens ) {
        tokenObj = {
          _id: t.id,
          name: actor.name,
          texture: { src: clock.image.texture.src },
          actorLink: true
        };
        update.push( tokenObj );
      }
      await TokenDocument.updateDocuments( update, { parent: game.scenes.current } );
    }
    // update the Actor
    const persistObj = await this.system.persistClockToActor({ actor, clock });
    const visualObj = {
      img: clock.image.texture.src,
      prototypeToken: {
        texture: { src: clock.image.texture.src },
        ...DEFAULT_TOKEN
      }
    };
    await actor.update( foundry.utils.mergeObject( visualObj, persistObj ) );
  }
}

export default {

  renderTokenHUD: async (_hud, html, token) => {

  log("Render")
  let t = canvas.tokens.get(token.id);
  let a = game.actors.get(token.actorId);

  if( !a?.flags['band-of-blades']?.clocks ) {
    return false;
  }

  const button1HTML = await foundry.applications.handlebars.renderTemplate('systems/band-of-blades/templates/bob-clock-button1.html');
  const button2HTML = await foundry.applications.handlebars.renderTemplate('systems/band-of-blades/templates/bob-clock-button2.html');

  html.querySelector("div.left").insertAdjacentHTML('beforeend', button1HTML);
  html.querySelector("div.left").addEventListener('click', async (event) => {
    log("HUD Clicked")
    // re-get in case there has been an update
    t = canvas.tokens.get(token.id);

    const oldClock = new BoBClock(a.flags['band-of-blades'].clocks);
    let newClock;

    const target = event.target.classList.contains("control-icon")
      ? event.target
      : event.target.parentElement;
      if (target.classList.contains("progress-up")) {
        newClock = oldClock.increment();
      } else if (target.classList.contains("progress-down")) {
        newClock = oldClock.decrement();
      } else if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if (target.dataset.action) {
        return;
      } else {
        return error("ERROR: Unknown TokenHUD Button");
      }

      const persistObj = {
        flags: {
          "band-of-blades": {
            clocks: {
              progress: newClock.progress,
              size: newClock.size,
              theme: newClock.theme
            }
          }
        }
      };

      const visualObj = {
        img: newClock.image.texture.src,
        prototypeToken: {
          texture: { src: newClock.image.texture.src },
          ...DEFAULT_TOKEN
        }
      };

    let newObj = foundry.utils.mergeObject(visualObj, persistObj);
    let tokenObj = {};
    let update = [];
    update.push( foundry.utils.mergeObject( { "_id": a.id }, newObj ) );
    await Actor.updateDocuments(update);

    update = [];
    const tokens = a.getActiveTokens();
    if( tokens.length !== 0 ) {
      for( const t of tokens ) {
        tokenObj = {
          _id: t.id,
          name: a.name,
          texture: { src: newClock.image.texture.src },
          flags: newClock.flags,
          actorLink: true
        };
        update.push( tokenObj );
      }
      await TokenDocument.updateDocuments( update, { parent: game.scenes.current } );
    }
  });


  html.querySelector("div.right").insertAdjacentHTML('beforeend', button2HTML);
  html.querySelector("div.right").addEventListener('click', async (event) => {
    log("HUD Clicked")
    // re-get in case there has been an update
    t = canvas.tokens.get(token.id);

    const oldClock = new BoBClock(a.flags['band-of-blades'].clocks);
    let newClock;

    const target = event.target.classList.contains("control-icon")
      ? event.target
      : event.target.parentElement;
      if (target.classList.contains("progress-up")) {
        newClock = oldClock.increment();
      } else if (target.classList.contains("progress-down")) {
        newClock = oldClock.decrement();
      } else if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if (target.dataset.action) {
        return;
      } else {
        return error("ERROR: Unknown TokenHUD Button");
      }

      const persistObj = {
        flags: {
          "band-of-blades": {
            clocks: {
              progress: newClock.progress,
              size: newClock.size,
              theme: newClock.theme
            }
          }
        }
      };

      const visualObj = {
        img: newClock.image.texture.src,
        prototypeToken: {
          texture: { src: newClock.image.texture.src },
          ...DEFAULT_TOKEN
        }
      };

    let newObj = foundry.utils.mergeObject(visualObj, persistObj);
    let tokenObj = {};
    let update = [];
    update.push( foundry.utils.mergeObject( { "_id": a.id }, newObj ) );
    await Actor.updateDocuments(update);
    update = [];
    const tokens = a.getActiveTokens();
    if( tokens.length !== 0 ) {
      for( const t of tokens ) {
        tokenObj = {
          _id: t.id,
          name: a.name,
          texture: { src: newClock.image.texture.src },
          flags: newClock.flags,
          actorLink: true
        };
        update.push( tokenObj );
      }
      await TokenDocument.updateDocuments( update, { parent: game.scenes.current } );
    }
  });
return true;
}}
