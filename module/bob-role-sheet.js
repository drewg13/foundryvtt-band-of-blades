
import { BoBSheet } from "./bob-sheet.js";
import {onManageActiveEffect, prepareActiveEffectCategories} from "./effects.js";
import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {BoBSheet}
 */
export class BoBRoleSheet extends BoBSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: [ "band-of-blades", "sheet", "actor" ],
  	  template: "systems/band-of-blades/templates/role-sheet.html",
      width: 900,
      height: 950,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "duties"}],
	    scrollY: [".sheet"]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = super.getData();
    data.isGM = game.user.isGM;
    data.editable = data.options.editable;
    const actorData = this.actor.data.toObject(false);
    data.actor = actorData;
    data.data = actorData.data;
    data.items = actorData.items.sort(function(a, b) {
      let textA = a.name.toUpperCase();
      let textB = b.name.toUpperCase();
      return textA.localeCompare(textB);
    });

    if( data.data.type === "Marshal" ) {
      const soldiers = BoBHelpers.getAllCharactersByClass( "Soldier", game );
      const rookies = BoBHelpers.getAllCharactersByClass( "Rookie", game );
      data.squaddies = [ ...rookies, ...soldiers ];
      const nonSquaddies = game.actors.filter( ( { id: id1 } ) => !data.squaddies.some( ( { _id: id2 } ) => id2 === id1 ) );
      const specialists = nonSquaddies.filter( s => s.type === "character" );
      data.specialists = specialists.map( s => {
        return s.data
      } );
      data.squaddies.forEach( s => {
        let heavy, medium, light = "white";
        if( s.data.harm.heavy.one === "" ) {
          heavy = "white";
        } else {
          heavy = "black";
        }
        if( ( s.data.harm.medium.one === "" ) && ( s.data.harm.medium.two === "" ) ) {
          medium = "white";
        } else if( ( s.data.harm.medium.one === "" ) || ( s.data.harm.medium.two === "" ) ) {
          medium = "red";
        } else {
          medium = "black";
        }
        if( ( s.data.harm.light.one === "" ) && ( s.data.harm.light.two === "" ) ) {
          light = "white";
        } else if( ( s.data.harm.light.one === "" ) || ( s.data.harm.light.two === "" ) ) {
          light = "red";
        } else {
          light = "black";
        }

        foundry.utils.mergeObject(
          s,
          {
            "data": {
              "heavyBox": heavy,
              "mediumBox": medium,
              "lightBox": light
            }
          }
        );
      } );
      data.specialists.forEach( s => {
        let heavy, medium, light;
        if( s.data.harm.heavy.one !== "" ) {
          heavy = "black";
        } else {
          heavy = "white";
        }
        if( ( s.data.harm.medium.one !== "" ) && ( s.data.harm.medium.two !== "" ) ) {
          medium = "black";
        } else if( ( s.data.harm.medium.one !== "" ) || ( s.data.harm.medium.two !== "" ) ) {
          medium = "red";
        } else {
          medium = "white";
        }
        if( ( s.data.harm.light.one !== "" ) && ( s.data.harm.light.two !== "" ) ) {
          light = "black";
        } else if( ( s.data.harm.light.one !== "" ) || ( s.data.harm.light.two !== "" ) ) {
          light = "red";
        } else {
          light = "white";
        }

        foundry.utils.mergeObject(
          s,
          {
            "data": {
              "heavyBox": heavy,
              "mediumBox": medium,
              "lightBox": light
            }
          }
        );
      } )
      data.squads = await BoBHelpers.getAllItemsByType( "squad", game );
      const specTypes = await BoBHelpers.getAllItemsByType( "class", game );
      data.specialistTypes = specTypes.filter( t => ( t.name !== "Rookie" ) && ( t.name !== "Soldier" ) );
    }

    if( data.data.type === "Lorekeeper" ) {
      data.fallenLength = Object.keys( data.data.resources.fallen ).length;
      data.fallenBlocks = Math.ceil( ( data.fallenLength + 1 ) / 4 ) - 1;
      if( data.data.resources.fallen[( data.fallenLength - 1 )] !== "" ) {
        foundry.utils.mergeObject(
          data.data.resources.fallen,
          { [ data.fallenLength ]: "" }
        );
      }
    }

    if( data.data.type === "Spymaster" ) {
      data.data.spies = BoBHelpers.getActorItemsByType( this.actor.id, "spies" ).length;
    }

    // Prepare active effects
    data.effects = prepareActiveEffectCategories(this.actor.effects);

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
