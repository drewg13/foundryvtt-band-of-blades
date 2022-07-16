
import { BoBSheet } from "./bob-sheet.js";
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";
import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {BoBSheet}
 */
export class BoBChosenSheet extends BoBSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: [ "band-of-blades", "sheet", "actor" ],
  	  template: "systems/band-of-blades/templates/chosen-sheet.html",
      width: 900,
      height: 950,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
	    scrollY: [".sheet"]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData( options ) {
    const superData = super.getData( options );
    const sheetData = superData.data;
    //sheetData.document = superData.actor;
    sheetData.owner = superData.owner;
    sheetData.editable = superData.editable;
    sheetData.isGM = game.user.isGM;

    // Prepare active effects
    sheetData.effects = prepareActiveEffectCategories(this.actor.effects);

    sheetData.items = superData.items.sort(function(a, b) {
      let textA = a.name.toUpperCase();
      let textB = b.name.toUpperCase();
      return textA.localeCompare(textB);
    });

    if( sheetData.system.favor !== "" ){
      sheetData.system.favorTypes = [];
      sheetData.system.favorTypes.push( sheetData.system.favor.split(",") );
    }
    if( sheetData.system.features !== "" ){
      sheetData.system.featureTypes = [];
      sheetData.system.featureTypes.push( sheetData.system.features.split(",") );
    }

    sheetData.system.description = await TextEditor.enrichHTML(sheetData.system.description, {secrets: sheetData.owner, async: true});

    return sheetData;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners( html );

    // Everything below here is only needed if the sheet is editable
    if ( !this.options.editable ) return;

    // Update Inventory Item
    html.find('.item-name').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(element.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(element.data("itemId"));
      if( item ) { await item.delete(); }
      element.slideUp(200, () => this.render(false));
    });

    // Post item to chat
    html.find(".item-post").click((ev) => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(element.data("itemId"));
      item.sendToChat();
    });

	  // Clear Flag
	  html.find('.flag-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      await this.actor.setFlag("band-of-blades", element.data("itemType"), "");
	    element.slideUp(200, () => this.render(false));
	  });

    // manage active effects
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));
	}

  /* -------------------------------------------- */

}
