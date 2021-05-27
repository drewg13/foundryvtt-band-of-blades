
import { BoBSheet } from "./bob-sheet.js";

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
      height: 970,
      tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
	    scrollY: [".description"]
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

    let actor_flags = this.actor.getFlag("band-of-blades", "ship") || [];

    // Calculate Load
    let loadout = 0;
    data.items.forEach( i => { loadout += ( i.type === "item" ) ? parseInt( i.data.load ) : 0 } );
    data.data.loadout.current = loadout;

    // Encumbrance Levels
    let load_level = [ "BITD.Empty","BITD.Light","BITD.Light","BITD.Light","BITD.Normal","BITD.Normal","BITD.Heavy","BITD.Heavy", "BITD.Heavy","BITD.OverMax","BITD.OverMax" ];
    let mule_level = [ "BITD.Empty","BITD.Light","BITD.Light","BITD.Light","BITD.Light","BITD.Normal","BITD.Normal","BITD.Heavy","BITD.Heavy", "BITD.Heavy","BITD.OverMax" ];

    //Sanity Check
    if (loadout < 0) {
      loadout = 0;
    }
    if (loadout > 10) {
      loadout = 10;
    }

	//look for abilities in assigned ship flags and set actor results

	actor_flags.forEach( i => {
	  if ( i.data.installs.loaded_inst === 1 ) {
	    data.data.loadout.heavy++;
		  data.data.loadout.normal++;
		  data.data.loadout.light++;
    } else {
		  data.data.loadout.heavy = data.data.loadout.heavy_default;
		  data.data.loadout.normal = data.data.loadout.normal_default;
		  data.data.loadout.light = data.data.loadout.light_default;
	  }

	  if ( i.data.installs.stress_max_up === 1 ) {
      data.data.stress.max++;
    } else {
		  data.data.stress.max = data.data.stress.max_default;
	  }

	  if ( i.data.installs.trauma_max_up === 1 ) {
      data.data.trauma.max++;
    } else {
		  data.data.trauma.max = data.data.trauma.max_default;
	  }

	  if ( i.data.installs.stun_inst === 1 ) {
      data.data.stun_weapons = 1;
	  } else {
		  data.data.stun_weapons = 0;
	  }

	  if ( i.data.installs.forged_inst === 1 ) {
      data.data.forged = 1;
	  } else {
		  data.data.forged = 0;
	  }
  });

	//set encumbrance level
  if ( data.data.loadout.heavy > data.data.loadout.heavy_default ) {
    data.data.loadout.load_level = mule_level[ data.data.loadout.current ];
  } else {
    data.data.loadout.load_level = load_level[ data.data.loadout.current ];
  }

	if ( data.data.loadout.planned < loadout ) {
		data.data.loadout.load_level = "BITD.OverMax";
	}
  const spec_skills = Object.keys( game.system.model.Actor.character.attributes.specialist.skills );

	spec_skills.forEach( s => {
	  //data.data.usesarray[s] = Array.from(Array(parseInt( data.data.attributes.specialist.skills[s].value) + 1).keys());
  })

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
      const item = this.document.items.get(element.data("itemId"));
      item.sheet.render(true);
    });

	  // Update Ship
    html.find('.ship-body').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const actor = game.actors.get(element.data("itemId"));
      actor.sheet.render(true);
    });

	  // Render XP Triggers sheet
    html.find('.xp-triggers').click(ev => {
      const itemId = this.actor.items.filter( i => i.type === "class" )[0]?.id;
      const item = this.document.items.get(itemId);
      item?.sheet.render(true, {"renderContext": "xp"});
    });

    // Delete Inventory Item
    html.find('.item-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      await this.document.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
      element.slideUp(200, () => this.render(false));
    });

	  // Clear Flag
	  html.find('.flag-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      await this.document.setFlag("band-of-blades", element.data("itemType"), "");
	    element.slideUp(200, () => this.render(false));
	  });
	}

  /* -------------------------------------------- */

}
