
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
      width: 770,
      height: 950,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
	    scrollY: [".sheet"],
      dragDrop: [{dragSelector: ".macroable", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData( options ) {
    const data = super.getData( options );
    data.isGM = game.user.isGM;
    data.editable = data.options.editable;
    const actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;
    data.items = actorData.items;

    // Prepare active effects
    data.effects = prepareActiveEffectCategories(this.actor.effects);

    if( this.actor.type === "character" ) {
      // Calculate Load
      let loadout = 0;
      data.items.forEach( i => {
        loadout += ( i.type === "item" ) ? parseInt( i.data.load ) : 0
      } );
      data.data.loadout.current = loadout;

      data.load_levels = { "BITD.Light": "BITD.Light", "BITD.Normal": "BITD.Normal", "BITD.Heavy": "BITD.Heavy" };
    }

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

    // Add Specialist Actions
    html.find('.skill-add-popup').click( async (ev) => {
      const skills = foundry.utils.deepClone( this.actor.data.data.attributes.specialist.skills );
      let html = `<div id="items-to-add">`;

      for( let e in skills ){
        html += `<input id="select-item-${e}" type="radio" name="select_items" value="${e}">`;
        html += `<label class="flex-horizontal" for="select-item-${e}">`;
        html += `${game.i18n.localize(skills[e].label)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(skills[e].tip)}</span></i>`;
        html += `</label>`;
      }

      html += `</div>`;

      let options = {
        width: "300"
      }
      let perms = this.actor.permission;

      if ( perms >= CONST.ENTITY_PERMISSIONS.OWNER ) {
        let dialog = new Dialog({
          title: `${game.i18n.localize('BITD.Add')} ${game.i18n.localize('BITD.SkillsSpecialist' )} ${game.i18n.localize('BITD.Actions' )}`,
          content: html,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize('BITD.Add'),
              callback: async () => await this.addSkillsToSheet($(document).find("#items-to-add"))
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('BITD.Cancel'),
              callback: () => false
            }
          },
          default: "two"
        }, options);

        dialog.render(true);
      }
    });

    // manage active effects
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));
	}

  /* -------------------------------------------- */

  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ( event.target.classList.contains("entity-link") ) return;

    // Create drag data
    const dragData = {
      actorId: this.actor.id
    };

    // Owned Items
    if ( li.dataset.rollAttribute ) {
      dragData.type = "Roll";
      dragData.data = li.dataset.rollAttribute;
    }

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  async addSkillsToSheet(el) {
    let items_to_add = [];

    el.find("input:checked").each(function() {
      items_to_add.push( $(this).val() );
    });
    if (this.document.permission >= CONST.ENTITY_PERMISSIONS.OWNER) {
      await this.actor.update( { 'data.attributes.specialist.skills': { [items_to_add]: { value: '1', max: 3 } } } );
    }

  }

}
