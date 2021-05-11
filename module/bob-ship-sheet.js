
import { BoBSheet } from "./bob-sheet.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {BoBSheet}
 */
export class BoBShipSheet extends BoBSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
	    classes: ["band-of-blades", "sheet", "actor"],
	  	template: "systems/band-of-blades/templates/ship-sheet.html",
	    width: 700,
	    height: 970,
	    tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "abilities"}],
		  scrollY: [".description"]
	  });
  }

 /** @override */
  getData() {
    const data = super.getData();
	  data.isGM = game.user.isGM;
		data.editable = data.options.editable;
    const actorData = data.data;
    data.actor = actorData;
		data.data = actorData.data;

	  return data;
  }

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-body').click(ev => {
      const element = $(ev.currentTarget).parents(".item");
      const item = this.document.items.get(element.data("itemId"));
			item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click( async (ev) => {
      const element = $(ev.currentTarget).parents(".item");
      await this.document.deleteEmbeddedDocuments("Item", [element.data("itemId")]);
			element.slideUp(200, () => this.render(false));
    });

    // Render XP Triggers sheet
    html.find('.xp-triggers').click(ev => {
      const itemId = this.actor.items.filter( i => i.type === "crew_type" )[0]?.id;
	    const item = this.document.items.get(itemId);
      item?.sheet.render(true, {"renderContext": "xp"});
    });
	}
  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {

    // Update the Item
    await super._updateObject( event, formData );
    let crew_data;
		crew_data = "data.data.crew";
    if (event.target && event.target.name === crew_data) {
      this.render(true);
    }
  }
  /* -------------------------------------------- */

}
