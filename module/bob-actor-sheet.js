
import { BoBSheet } from "./bob-sheet.js";
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {BoBSheet}
 */
export class BoBActorSheet extends BoBSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: [ "band-of-blades", "sheet", "actor" ],
  	  template: "systems/band-of-blades/templates/actor-sheet.html",
      width: 800,
      height: 900,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
	    scrollY: [".sheet"]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.isGM = game.user.isGM;
    data.editable = data.options.editable;
    const actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;
    data.items = actorData.items;

    // Prepare active effects
    data.effects = prepareActiveEffectCategories(this.actor.effects);

    // Calculate Load
    let loadout = 0;
    data.items.forEach( i => { loadout += ( i.type === "item" ) ? parseInt( i.data.load ) : 0 } );
    data.data.loadout.current = loadout;

	  data.load_levels = {"BITD.Light":"BITD.Light", "BITD.Normal":"BITD.Normal", "BITD.Heavy":"BITD.Heavy"};

    return data;
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
      //await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
      element.slideUp(200, () => this.render(false));
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
