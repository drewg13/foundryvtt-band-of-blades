
import { BoBSheet } from "./bob-sheet.js";
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";
import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {BoBSheet}
 */
export class BoBRoleSheet extends BoBSheet {

  /**
   * IDs for items on the sheet that have been expanded.
   * @type {Set<string>}
   * @protected
   */
  _expanded = new Set();

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: [ "band-of-blades", "sheet", "actor" ],
  	  template: "systems/band-of-blades/templates/role-sheet.html",
      width: 940,
      height: 950,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "duties"}],
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

    sheetData.dropdowns = game.settings.get("band-of-blades", "useDropdownsForItemUses");

    sheetData.foodStores = Math.min( 6, ( 3 + sheetData.system.resources.supply.extraUses ) );

    let spies = sheetData.items.filter( s => s.type === "spies" );
    let spiesArray = [];
    spies.forEach( s => spiesArray.push( [ s._id, s.name ] ) );
    sheetData.spyList = Object.fromEntries( spiesArray );
    sheetData.spyList = foundry.utils.mergeObject( sheetData.spyList, { "0": "Unassigned" } )

    if( sheetData.system.type === "Marshal" ) {
      const soldiers = BoBHelpers.getAllCharactersByClass( "Soldier", game );
      const rookies = BoBHelpers.getAllCharactersByClass( "Rookie", game );
      sheetData.squaddies = [ ...rookies, ...soldiers ];
      const nonSquaddies = game.actors.filter( ( { id: id1 } ) => !sheetData.squaddies.some( ( { _id: id2 } ) => id2 === id1 ) );
      const specialists = nonSquaddies.filter( s => ( s.type === "character" ) && ( s.system.class !== "" ) );
      sheetData.specialists = specialists.map( s => {
        return s
      } );
      sheetData.squaddies.forEach( s => {
        let heavy, medium, light = "white";
        if( s.system.harm.heavy.one === "" ) {
          heavy = "white";
        } else {
          heavy = "black";
        }
        if( ( s.system.harm.medium.one === "" ) && ( s.system.harm.medium.two === "" ) ) {
          medium = "white";
        } else if( ( s.system.harm.medium.one === "" ) || ( s.system.harm.medium.two === "" ) ) {
          medium = "red";
        } else {
          medium = "black";
        }
        if( ( s.system.harm.light.one === "" ) && ( s.system.harm.light.two === "" ) ) {
          light = "white";
        } else if( ( s.system.harm.light.one === "" ) || ( s.system.harm.light.two === "" ) ) {
          light = "red";
        } else {
          light = "black";
        }

        foundry.utils.mergeObject(
          s,
          {
            "system": {
              "heavyBox": heavy,
              "mediumBox": medium,
              "lightBox": light
            }
          }
        );
      } );
      sheetData.specialists.forEach( s => {
        let heavy, medium, light;
        if( s.system.harm.heavy.one !== "" ) {
          heavy = "black";
        } else {
          heavy = "white";
        }
        if( ( s.system.harm.medium.one !== "" ) && ( s.system.harm.medium.two !== "" ) ) {
          medium = "black";
        } else if( ( s.system.harm.medium.one !== "" ) || ( s.system.harm.medium.two !== "" ) ) {
          medium = "red";
        } else {
          medium = "white";
        }
        if( ( s.system.harm.light.one !== "" ) && ( s.system.harm.light.two !== "" ) ) {
          light = "black";
        } else if( ( s.system.harm.light.one !== "" ) || ( s.system.harm.light.two !== "" ) ) {
          light = "red";
        } else {
          light = "white";
        }

        foundry.utils.mergeObject(
          s,
          {
            "system": {
              "heavyBox": heavy,
              "mediumBox": medium,
              "lightBox": light
            }
          }
        );
      } )
      sheetData.squads = await BoBHelpers.getAllItemsByType( "squad", game );
      const specTypes = await BoBHelpers.getAllItemsByType( "class", game );
      sheetData.specialistTypes = specTypes.filter( t => ( t.system.class !== "Rookie" ) && ( t.system.class !== "Soldier" ) );
    }

    if( sheetData.system.type === "Lorekeeper" ) {
      sheetData.fallenLength = Object.keys( sheetData.system.resources.fallen ).length;
      sheetData.fallenBlocks = Math.ceil( ( sheetData.fallenLength + 1 ) / 4 ) - 1;
      if( sheetData.system.resources.fallen[( sheetData.fallenLength - 1 )] !== "" ) {
        foundry.utils.mergeObject(
          sheetData.system.resources.fallen,
          { [ sheetData.fallenLength ]: "" }
        );
      }
    }

    if( sheetData.system.type === "Spymaster" ) {
      sheetData.system.spies = BoBHelpers.getActorItemsByType( this.actor.id, "spies" ).length;
    }

    sheetData.items.forEach( i => {
      i.isExpanded = this._expanded.has(i._id);
    });

    // Prepare active effects
    sheetData.effects = prepareActiveEffectCategories(this.actor.effects);

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
      const itemId = li.data("item-id");
      const data = $(ev.currentTarget).data("expand");
      // Toggle summary
      if ( li.hasClass("expanded") ) {
        let summary = li.parents(".summary-anchor").children(".item-summary");
        summary.slideUp(200, () => summary.remove());
        this._expanded.delete(itemId);
      } else {
        let div = $( `<div class="item-summary">${ data }</div>` );
        li.parents(".summary-anchor").append(div.hide());
        div.slideDown(200);
        this._expanded.add(itemId);
      }
      li.toggleClass("expanded");
    });

    // Update Inventory Item
    html.find('.item-name').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(element.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.materiel-add').click( async (ev) => {
      const itemType = $(ev.currentTarget).data("mtype");
      let mItems = await BoBHelpers.getAllItemsByType( "materiel", game );
      let item = mItems.find( i => i.system.itemType === itemType );
      await this.actor.createEmbeddedDocuments( "Item", [ item ] );
    });

    html.find('.personnel-add').click( async (ev) => {
      const itemType = $(ev.currentTarget).data("mtype");
      let mItems = await BoBHelpers.getAllItemsByType( "personnel", game );
      let item = mItems.find( i => i.system.itemType === itemType );
      await this.actor.createEmbeddedDocuments( "Item", [ item ] );
    });

    // Update Actor
    html.find('.actor-name').click( ev => {
      const element = $(ev.currentTarget).parents(".item");
      const actor = game.actors.get(element.data("itemId"));
      actor.sheet.render( true );
    });

    // Create Rookies
    html.find('.rookie-create').click( event => {
      const squad = $(event.currentTarget).data("itemType")
      BoBHelpers.createRookies( squad, 5 );
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

    // Post QM project to chat
    html.find(".project-post").click( async (ev) => {
      const element = $(ev.currentTarget).parents(".project");
      const project = this.actor.system.resources.projects[ element.data("project") ];
      const html = await renderTemplate("systems/band-of-blades/templates/items/chat-item.html", project);
      const chatData = {
        user: game.userId,
        content: html,
      };
      const message = await ChatMessage.create(chatData);
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
