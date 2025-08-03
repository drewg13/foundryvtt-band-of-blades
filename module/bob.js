
// Import Modules
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { bobRoll, simpleRollPopup } from "./bob-roll.js";
import { BoBHelpers } from "./bob-helpers.js";
import { BoBActor } from "./bob-actor.js";
import { BoBItem } from "./bob-item.js";
import { BoBItemSheet } from "./bob-item-sheet.js";
import { BoBActorSheet } from "./bob-actor-sheet.js";
import { BoBRoleSheet } from "./bob-role-sheet.js";
import { BoBChosenSheet } from "./bob-chosen-sheet.js";
import { BoBMinionSheet } from "./bob-minion-sheet.js";
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
Hooks.once("init", function() {
  console.log(`Initializing ${game.system.id} System`);

  game.bob = {
    dice: bobRoll
  }
  game.system.bobclocks = {
    themes: ["black", "grey", "white", "red", "yellow", "green", "blue"],
    sizes: [ 4, 6, 8, 10, 12 ]
  };
  game.system.traumaList = ["cold", "haunted", "obsessed", "paranoid", "reckless", "soft", "unstable", "vicious"];
  game.system.blightList = ["anathema", "host", "hunger", "miasma", "mutated", "rage", "rot", "visions"];
  game.BoBHelpers = BoBHelpers;

  CONFIG.Item.documentClass = BoBItem;
  CONFIG.Actor.documentClass = BoBActor;

  // disable token ruler
  CONFIG.Token.rulerClass = null;

  // Register System Settings
  registerSystemSettings();

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("band-of-blades", BoBActorSheet, { types: ["character"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("band-of-blades", BoBRoleSheet, { types: ["role"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("band-of-blades", BoBChosenSheet, { types: ["chosen"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("band-of-blades", BoBMinionSheet, { types: ["minion"], makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("band-of-blades", BoBClockSheet, { types: ["\uD83D\uDD5B clock"], makeDefault: true });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("band-of-blades", BoBItemSheet, {makeDefault: true});

  // allow Handlebars lookups to use variables for initial key and return subvalues
  Handlebars.registerHelper("lookup2", function(object, property, subproperty, options) {
    let newObject = object ? options.lookupProperty(object, property) : object;
    let subObject = newObject ? options.lookupProperty(newObject, subproperty) : newObject;
    return subObject;
  });

  // allow Handlebars lookups to combine strings with variables
  Handlebars.registerHelper("lookupstring", function(string, variable, options) {
    let newString = string ? string + String( variable ) : string;
    return newString ? newString : "";
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
          let escapedValue = RegExp.escape(Handlebars.escapeExpression(selected_value));
          let rgx = new RegExp(' value=\"' + escapedValue + '\"');
          let oldHtml = html;
          html = html.replace(rgx, "$& checked");
          while( ( oldHtml === html ) && ( escapedValue >= 0 ) ){
            escapedValue--;
            rgx = new RegExp(' value=\"' + escapedValue + '\"');
            html = html.replace(rgx, "$& checked");
          }
        }
      });
    }
    return html;
  });

  // Trauma Counter
  Handlebars.registerHelper('traumacounter', function(selected, max, options) {

    let html = options.fn(this);

    let count = 0;
    for (const trauma in selected) {
      if (selected[trauma] === true) {
        count++;
      }
    }

    if (count > max) count = max;

    const rgx = new RegExp(' value=\"' + count + '\"');
    return html.replace(rgx, "$& checked");

  });

  // NotEquals handlebar.
  Handlebars.registerHelper('noteq', (a, b, options) => {
    return (a !== b) ? options.fn(this) : '';
  });

  // String handlebar.
  Handlebars.registerHelper('str', (value) => {
    return String(value);
  });

  // Number handlebar.
  Handlebars.registerHelper('num', (value) => {
    return parseInt(value);
  });

  //Case-insensitive comparison
  Handlebars.registerHelper('caseeq', (a, b) => {
    return (a.toUpperCase() === b.toUpperCase());
  });

  //Less than comparison
  Handlebars.registerHelper('lteq', (a, b) => {
    return (a <= b);
  });

  Handlebars.registerHelper('gteq', (a, b) => {
    return (a >= b);
  });

  Handlebars.registerHelper('not', (a) => {
    return !a;
  });

  Handlebars.registerHelper('notNum', (a) => {
    return isNaN(a);
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

  // "N Times" loop for handlebars.
  //  Block is executed X times starting from n=Y.
  //
  // Usage:
  // {{#times_from_x 1 10}}
  //   <span>{{this}}</span>
  // {{/times_from_x}}
  Handlebars.registerHelper('times_from_x', function(x, y, block) {

    let accum = '';
    for (let i = x; i <= y; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  Handlebars.registerHelper('add', function(a, b) {
    return (a + b);
  });

  Handlebars.registerHelper('mult', function(a, b) {
    return (a * b);
  });

  Handlebars.registerHelper('pcase', function(a) {
    return BoBHelpers.getProperCase( a );
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

  Handlebars.registerHelper('bob-clock', function(parameter_name, type, current_value, uniq_id, theme=null) {

    let html = '';
    if( theme === null ) {
      theme = game.system.bobclocks.themes[ game.settings.get( "band-of-blades", "defaultClockTheme" ) ];
    }
    if (current_value === null) {
      current_value = 0;
    }

    if (parseInt(current_value) > parseInt(type)) {
      current_value = type;
    }

    // Label for 0
    html += `<label class="clock-zero-label" for="clock-0-${uniq_id}}"><i class="fab fa-creative-commons-zero nullifier"></i></label>`;
    html += `<div id="bob-clock-${uniq_id}" class="bob-clock clock-${type} clock-${type}-${current_value}" style="background-image:url('/systems/band-of-blades/themes/${theme}/${type}clock_${current_value}.svg');">`;

    let zero_checked = (parseInt(current_value) === 0) ? 'checked' : '';
    html += `<input type="radio" value="0" id="clock-0-${uniq_id}}" data-dtype="String" name="${parameter_name}" ${zero_checked}>`;

    for (let i = 1; i <= parseInt(type); i++) {
      let checked = (parseInt(current_value) === i) ? 'checked' : '';
      html += `
        <input data-resource="clock" type="radio" value="${i}" id="clock-${i}-${uniq_id}" data-dtype="String" name="${parameter_name}" ${checked}>
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
Hooks.once("ready", function() {

  // default map note visibility to on, for journal entries with proper permissions
  game.settings.settings.get("core.notesDisplayToggle").default = true;

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => BoBHelpers.createBoBMacro(data, slot));

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

// re-render the Marshal sheet after updating any squad sheets to catch changes made
Hooks.on("renderBoBActorSheet", (sheet, html, options) => {
  let marshals = game.actors.filter( a => a.system.type === "Marshal" ).map( a => { return a.id } );
  marshals.forEach( m => {
    game.actors.get( m ).sheet.render(false);
  });

});

// Send Role resource changes to chat
Hooks.on("preUpdateActor", (actor, data, options, userId) => {
  if ( ( actor.type === "role" ) && ( Object.keys(data)[0] === "system" ) && ( Object.keys(data.system)[0] === "resources" )) {
    let item = Object.keys(data.system.resources)[0];
    let subItem;
    if( item === "projects") { subItem = Object.keys(Object.values(Object.entries(data.system.resources)[0][1])[0])[0]; }
    let actorName = actor.name;
    let resource, newValue, oldValue, result;
    switch ( item ) {
      case "intel":
        resource = game.i18n.localize("BITD.Intel");
        newValue = parseInt( data.system.resources[item] );
        oldValue = parseInt( actor.system.resources[item] );
        break;
      case "pressure":
        resource = game.i18n.localize("BITD.Pressure");
        newValue = parseInt( data.system.resources[item] );
        oldValue = parseInt( actor.system.resources[item] );
        break;
      case "morale":
        resource = game.i18n.localize("BITD.Morale");
        newValue = parseInt( data.system.resources[item] );
        oldValue = parseInt( actor.system.resources[item] );
        break;
      case "engagement":
        resource = game.i18n.localize("BITD.Engagement");
        newValue = parseInt( data.system.resources[item] );
        oldValue = parseInt( actor.system.resources[item] );
        break;
      case "supply":
        resource = game.i18n.localize("BITD.Supply");
        newValue = parseInt( data.system.resources[item].value );
        oldValue = parseInt( actor.system.resources[item].value );
        break;
      case "time":
        resource = Object.keys( data.system.resources[item] )[0];
        newValue = parseInt( data.system.resources.time[resource].value );
        oldValue = parseInt( actor.system.resources.time[resource].value );
        result = resource.replace(/([A-Z 0-9])/g, " $1");
        resource = result.charAt(0).toUpperCase() + result.slice(1);
        break;
      case "projects":
        if( subItem !== "value" ){ return }
        resource = Object.keys( data.system.resources[item] )[0];
        newValue = parseInt( data.system.resources.projects[resource].value );
        oldValue = parseInt( actor.system.resources.projects[resource].value );
        resource = actor.system.resources.projects[resource].name + " Project Clock";
        break;
      case "camp":
      case "fallen":
      case "missions":
        item = undefined;
        break;
      default:
        console.log(item, newValue, oldValue);
        break;
    }
    if ( item !== undefined && game.settings.get("band-of-blades", "logResourceToChat") ) {
      BoBHelpers.chatNotify( actorName, resource, oldValue, newValue );
    }
  }
});

Hooks.on("getSceneControlButtons", (controls) => {
  controls.tokens.tools.bobdice = {
    name: "bobdice",
    title: "Dice Roller",
    icon: "fas fa-dice",
    onChange: () => simpleRollPopup(),
    button: true
  };
  ClockTiles.getSceneControlButtons(controls);
});

Hooks.on("renderTileHUD", async (hud, html, tileData) => {
  await ClockTiles.renderTileHUD(hud, html, tileData);
});

Hooks.on("renderTokenHUD", async (hud, html, token) => {
  let rootElement = document.getElementsByClassName('vtt game')[0];
  if( await ClockSheet.renderTokenHUD(hud, html, token) ) {
    rootElement.classList.add('hide-ui');
  } else {
    rootElement.classList.remove('hide-ui');
  }
});
