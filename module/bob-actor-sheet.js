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
      width: 790,
      height: 950,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
	    scrollY: [".sheet"],
      dragDrop: [{dragSelector: ".macroable", dropSelector: null}]
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

    sheetData.dropdowns = game.settings.get("band-of-blades", "useDropdownsForItemUses");

    if( sheetData.type === "character" ) {
      // Calculate Load
      let loadout = 0;
      sheetData.items.forEach( i => {
        loadout += ( i.type === "item" ) ? parseInt( i.system.load ) : 0
      } );
      sheetData.loadout = sheetData.loadout || {};
      sheetData.system.loadout.current = loadout;
      sheetData.load_levels = { "BITD.Light": "BITD.Light", "BITD.Normal": "BITD.Normal", "BITD.Heavy": "BITD.Heavy" };

      // Total any skill bonuses
      const attributes = Object.keys( game.system.model.Actor.character.attributes );
      attributes.forEach( a => {
        let skills = Object.keys( game.system.model.Actor.character.attributes[a].skills );
        skills.forEach ( s => {
          sheetData.system.attributes[a].skills[s].maxTotal = sheetData.system.attributes[a].skills[s].max + sheetData.system.attributes[a].skills[s].maxBonus;
        })
      })
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

    // Expand item description
    html.find('.expandable').click(ev => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      const data = $(ev.currentTarget).data("expand");
      // Toggle summary
      if ( li.hasClass("expanded") ) {
        let summary = li.parents(".summary-anchor").children(".item-summary");
        summary.slideUp(200, () => summary.remove());
      } else {
        let div = $( `<div class="item-summary">${ data }</div>` );
        li.parents(".summary-anchor").append(div.hide());
        div.slideDown(200);
      }
      li.toggleClass("expanded");
    });

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
    html.find(".item-post").click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(element.data("itemId"));
      await item.sendToChat();
    });

	  // Clear Flag
	  html.find('.flag-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      await this.actor.setFlag("band-of-blades", element.data("itemType"), "");
	    element.slideUp(200, () => this.render(false));
	  });

    // Add Specialist Actions
    html.find('.skill-add-popup').click( async () => {
      const skills = foundry.utils.deepClone( this.actor.system.attributes.specialist.skills );
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

      if ( this.actor.isOwner ) {
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

    html.find('.skill-delete').click( async (ev) => {
      let skill = ev.currentTarget.parentElement.dataset.rollAttribute;
      if ( this.actor.isOwner ) {
        await this.actor.update( { 'system.attributes.specialist.skills': { [skill]: { value: '0', max: 0 } } } );
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
      actorId: this.actor._id
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
    if ( this.actor.isOwner ) {
      await this.actor.update( { 'system.attributes.specialist.skills': { [items_to_add]: { value: '1', max: 3 } } } );
    }

  }

}
