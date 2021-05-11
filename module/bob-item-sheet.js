/**
 * Extend the basic ItemSheet
 * @extends {ItemSheet}
 */
export class BoBItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["band-of-blades", "sheet", "item"],
			width: 900,
			height: 'auto',
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
  }

  /* -------------------------------------------- */

/** @override */
  getData() {
    const data = super.getData();
	  data.isGM = game.user.isGM;
		data.editable = data.options.editable;
    const itemData = data.data;
    data.item = itemData;
		data.data = itemData.data;

		return data;
  }

  /** @override */
  get template() {
    const path = "systems/band-of-blades/templates/items";
    let simple_item_types = ["background", "heritage", "vice", "crew_reputation", "ship_size"];
    let template_name = `${this.item.data.type}`;

    if (simple_item_types.indexOf(this.item.data.type) >= 0) {
      template_name = "simple";
    }

		return `${path}/${template_name}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
  }

  /* -------------------------------------------- */
}
