/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./bob-templates.js";
import { bobRoll, simpleRollPopup } from "./bob-roll.js";
import { BoBHelpers } from "./bob-helpers.js";
import { BoBActor } from "./bob-actor.js";
import { BoBItem } from "./bob-item.js";
import { BoBItemSheet } from "./bob-item-sheet.js";
import { BoBActorSheet } from "./bob-actor-sheet.js";
import { BoBShipSheet } from "./bob-ship-sheet.js";
import { BoBUniverseSheet } from "./bob-universe-sheet.js";
import * as migrations from "./migration.js";
/* For Clocks UI */
import { BoBClockSheet } from "./bob-clock-sheet.js";
import ClockTiles from "./bob-clock-tiles.js";
import ClockSheet from "./bob-clock-sheet.js";
import { log } from "./bob-clock-util.js";

window.BoBHelpers = BoBHelpers;


/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function() {
  console.log(`Initializing Band of Blades System`);

  game.sav = {
    dice: bobRoll
  }
  game.system.bobclocks = {
    themes: ["black"],
    sizes: [ 4, 6, 8 ]
  };

  const versionParts = game.data.version.split('.');
  game.majorVersion = parseInt(versionParts[1]);
  game.minorVersion = parseInt(versionParts[2]);

  CONFIG.Item.documentClass = BoBItem;
  CONFIG.Actor.documentClass = BoBActor;

  // Register System Settings
  registerSystemSettings();

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("band-of-blades", BoBActorSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("band-of-blades", BoBShipSheet, { types: ["ship"], makeDefault: true });
  Actors.registerSheet("band-of-blades", BoBClockSheet, { types: ["\uD83D\uDD5B clock"], makeDefault: true });
  Actors.registerSheet("band-of-blades", BoBUniverseSheet, { types: ["universe"], makeDefault: true});
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("band-of-blades", BoBItemSheet, {makeDefault: true});
  await preloadHandlebarsTemplates();

  // allow Handlebars lookups to use variables for initial key and return subvalues
  Handlebars.registerHelper("lookup2", function(object, property, subproperty, options) {
    let newObject = object ? options.lookupProperty(object, property) : object;
    let subObject = newObject ? options.lookupProperty(newObject, subproperty) : newObject;
    return subObject ? subObject : {};
  });

  // Multiboxes.
  Handlebars.registerHelper('multiboxes', function(selected, options) {

    let html = options.fn(this);

    // Fix for single non-array values.
    if ( !Array.isArray(selected) ) {
      selected = [selected];
    }

    if (typeof selected !== 'undefined') {
      selected.forEach(selected_value => {
        if (selected_value !== false) {
          const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected_value));
          const rgx = new RegExp(' value=\"' + escapedValue + '\"');
          html = html.replace(rgx, "$& checked=\"checked\"");
        }
      });
    }
    return html;
  });

  // Trauma Counter
  Handlebars.registerHelper('traumacounter', function(selected, options) {

    let html = options.fn(this);

    let count = 0;
    for (const trauma in selected) {
      if (selected[trauma] === true) {
        count++;
      }
    }

    if (count > 5) count = 5;

    const rgx = new RegExp(' value=\"' + count + '\"');
    return html.replace(rgx, "$& checked=\"checked\"");

  });

  // NotEquals handlebar.
  Handlebars.registerHelper('noteq', (a, b, options) => {
    return (a !== b) ? options.fn(this) : '';
  });

  //Case-insensitive comparison
  Handlebars.registerHelper('caseeq', (a, b) => {
    return (a.toUpperCase() === b.toUpperCase());
  });

  //Less than comparison
  Handlebars.registerHelper('lteq', (a, b) => {
    return (a <= b);
  });


  // Enrich the HTML replace /n with <br>
  Handlebars.registerHelper('html', (options) => {

    let text = options.hash['text'].replace(/\n/g, "<br />");

    return new Handlebars.SafeString(text);
  });

  // "N Times" loop for handlebars.
  //  Block is executed N times starting from n=1.
  //
  // Usage:
  // {{#times_from_1 10}}
  //   <span>{{this}}</span>
  // {{/times_from_1}}
  Handlebars.registerHelper('times_from_1', function(n, block) {

    let accum = '';
    for (let i = 1; i <= n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // "N Times" loop for handlebars.
  //  Block is executed N times starting from n=0.
  //
  // Usage:
  // {{#times_from_0 10}}
  //   <span>{{this}}</span>
  // {{/times_from_0}}
  Handlebars.registerHelper('times_from_0', function(n, block) {

    let accum = '';
    for (let i = 0; i <= n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  // Concat helper
  // https://gist.github.com/adg29/f312d6fab93652944a8a1026142491b1
  // Usage: (concat 'first 'second')
  Handlebars.registerHelper('concat', function() {
    let outStr = '';
    for(let arg in arguments){
        if(typeof arguments[arg]!='object'){
            outStr += arguments[arg];
        }
    }
    return outStr;
  });


  /**
   * @inheritDoc
   * Takes label from Selected option instead of just plain value.
   */

  Handlebars.registerHelper('selectOptionsWithLabel', function(choices, options) {

    const localize = options.hash['localize'] ?? false;
    let selected = options.hash['selected'] ?? null;
    let blank = options.hash['blank'] || null;
    selected = selected instanceof Array ? selected.map(String) : [String(selected)];

    // Create an option
    const option = (key, object) => {
      if ( localize ) object.label = game.i18n.localize(object.label);
      let isSelected = selected.includes(key);
      html += `<option value="${key}" ${isSelected ? "selected" : ""}>${object.label}</option>`
    };

    // Create the options
    let html = "";
    if ( blank ) option("", blank);
    Object.entries(choices).forEach(e => option(...e));

    return new Handlebars.SafeString(html);
  });


  /**
   * Create appropriate clock
   */

  Handlebars.registerHelper('sav-clock', function(parameter_name, type, current_value, uniq_id) {

    let html = '';

    if (current_value === null) {
      current_value = 0;
    }

    if (parseInt(current_value) > parseInt(type)) {
      current_value = type;
    }

    // Label for 0
    html += `<label class="clock-zero-label" for="clock-0-${uniq_id}}"><i class="fab fa-creative-commons-zero nullifier"></i></label>`;
    html += `<div id="sav-clock-${uniq_id}" class="sav-clock clock-${type} clock-${type}-${current_value}" style="background-image:url('/systems/band-of-blades/themes/black/${type}clock_${current_value}.svg');">`;

    let zero_checked = (parseInt(current_value) === 0) ? 'checked="checked"' : '';
    html += `<input type="radio" value="0" id="clock-0-${uniq_id}}" name="${parameter_name}" ${zero_checked}>`;

    for (let i = 1; i <= parseInt(type); i++) {
      let checked = (parseInt(current_value) === i) ? 'checked="checked"' : '';
      html += `
        <input type="radio" value="${i}" id="clock-${i}-${uniq_id}" name="${parameter_name}" ${checked}>
        <label for="clock-${i}-${uniq_id}"></label>
      `;
    }

    html += `</div>`;
    return html;
  });

});

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", async function() {

  // Determine whether a system migration is required
  const currentVersion = game.settings.get("band-of-blades", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = 1.0;

  let needMigration = (currentVersion < NEEDS_MIGRATION_VERSION) || (currentVersion === null);

  // Perform the migration
  if ( needMigration && game.user.isGM ) {
    //migrations.migrateWorld();
  }
});

/*
 * Hooks
 */

Hooks.on( "preCreateItem", async (item, data, options, userId) => {
  let actor = item.parent ? item.parent : null;
  if ( actor?.documentName === "Actor" ) {
    await BoBHelpers.removeDuplicatedItemType( data, actor );
  }
  return true;
});

Hooks.on("createItem", async (item, options, userId) => {

  let actor = item.parent ? item.parent : null;
  let data = item.data;
  if ( (actor?.documentName === "Actor") && (actor?.permission >= CONST.ENTITY_PERMISSIONS.OWNER) ) {
    await BoBHelpers.callItemLogic(data, actor);

    if ( ( ( data.type === "class" ) || ( data.type === "crew_type" ) ) && ( data.data.def_abilities !== "" ) ) {
      await BoBHelpers.addDefaultAbilities( data, actor );
    }

    if ( ( ( data.type === "class" ) || ( data.type === "crew_type" ) ) && ( ( actor.img.slice( 0, 43 ) === "systems/band-of-blades/styles/assets/icons/" ) || ( actor.img === "icons/svg/mystery-man.svg" ) ) ) {
      const icon = data.img;
      const icon_update = {
        img: icon,
        token: {
          img: icon
        }
      };
      actor.data.update( icon_update );
    }
  }
  return true;
});

Hooks.on("deleteItem", async (item, options, userId) => {
  let actor = item.parent ? item.parent : null;
  let data = item.data;
  if ( (actor?.documentName === "Actor") && (actor?.permission >= CONST.ENTITY_PERMISSIONS.OWNER) ) {
    await BoBHelpers.undoItemLogic(data, actor);
  }
  return true;
});

// getSceneControlButtons
Hooks.on("renderSceneControls", (app, html) => {
  let dice_roller = $('<li class="scene-control" title="Dice Roll"><i class="fas fa-dice"></i></li>');
  dice_roller.on( "click", async function() {
    await simpleRollPopup();
  })
  html.append(dice_roller);
});

//For Clocks UI
Hooks.once("init", () => {
  log(`Init ${game.data.system.id}`);
});

Hooks.on("getSceneControlButtons", (controls) => {
  ClockTiles.getSceneControlButtons(controls);
});

Hooks.on("renderTileHUD", async (hud, html, tile) => {
  await ClockTiles.renderTileHUD(hud, html, tile);
});

Hooks.on("renderTokenHUD", async (hud, html, token) => {
  let rootElement = document.getElementsByClassName('vtt game')[0];
  if( await ClockSheet.renderTokenHUD(hud, html, token) ) {
    rootElement.classList.add('hide-ui');
  } else {
    rootElement.classList.remove('hide-ui');
  }
});
