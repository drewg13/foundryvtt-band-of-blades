/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

export class BoBSheet extends foundry.appv1.sheets.ActorSheet {

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-add-popup").click(this._onItemAddClick.bind(this));
    html.find(".item-delete-all").click(this._onDeleteAllClick.bind(this));
	  html.find(".flag-add-popup").click(this._onFlagAddClick.bind(this));
	  html.find(".roll-die-attribute").click(this._onRollAttributeDieClick.bind(this));

  }

  /* -------------------------------------------- */

  async _onItemAddClick(event) {
    event.preventDefault();
	  const item_type = $(event.currentTarget).data("itemType")
		const limiter = $(event.currentTarget).data("limiter")
		const distinct = $(event.currentTarget).data("distinct")
    let input_type = "checkbox";

    if (typeof distinct !== "undefined") {
      input_type = "radio";
    }

	  let items = await BoBHelpers.getAllItemsByType(item_type, game);
    let html = `<div class="band-of-blades" id="items-to-add">`;

	  if( item_type === "class" ) {
	    html += `<div class="class-help">${game.i18n.localize('BITD.ClassWarning')}</div>`;
    }

    items.forEach(e => {
      let addition_price_load = ``;

      if (typeof e.system.load !== "undefined") {
        addition_price_load += `(${e.system.load})`
      } else if (typeof e.system.price !== "undefined") {
        addition_price_load += `(${e.system.price})`
      }

      if (e.type === "trait") {
		    if ( e.system.class === this.actor.system.heritage ) {
			    html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
			    html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
			    html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
			    html += `</label>`;
		    }
	    } else if (e.type === "ability") {
		    if ( ( e.system.class === this.actor.system.class ) || ( ( e.system.class === "General" ) && ( ( this.actor.system.class !== "Rookie") && ( this.actor.system.class !== "" ) ) ) ) {
			    html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
			    html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
			    html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
			    html += `</label>`;
		    }
	    } else if (e.type === "item") {
		    if ( ( ( e.system.class === this.actor.system.class ) && ( ( ( e.system.load_type === game.i18n.localize("BITD.Light") ) || ( e.system.load_type === "Utility" ) ) ||
          ( ( e.system.load_type === game.i18n.localize("BITD.Normal") ) && ( this.actor.system.loadout?.selected_load_level === "BITD.Normal" ) ) ||
          ( ( ( e.system.load_type === game.i18n.localize("BITD.Normal") ) || ( e.system.load_type === game.i18n.localize("BITD.Heavy") ) ) && ( this.actor.system.loadout?.selected_load_level === "BITD.Heavy" ) ) ) ) ||
          ( ( this.actor.system.item_triggers?.grenadier === 1 ) && ( e.system.class === "Grenadier") ) ||
          ( ( this.actor.system.item_triggers?.crimson === 1 ) && ( e.system.class === "Crimson") ) ||
          ( ( this.actor.system.item_triggers?.chemist === 1 ) && ( e.system.class === "Chemist") ) ||
          ( ( this.actor.system.item_triggers?.pious === 1 ) && ( e.system.class === "Pious") )) {
			      html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
			      html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
			      html += `${game.i18n.localize(e.name)} ${addition_price_load} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
			      html += `</label>`;
		    }
      } else if (e.type === "materiel") {
        if ( ( ( ( this.actor.system.resources.carts < 3 ) && ( e.system.itemType === "Supply Cart" ) ) || ( e.system.itemType !== "Supply Cart" ) ) &&
          ( ( ( this.actor.system.resources.siege < 3 ) && ( e.system.itemType === "Siege Weapons" ) ) || ( e.system.itemType !== "Siege Weapons" ) ) ) {
          html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
          html += `</label>`;
        }
      } else if (e.type === "personnel") {
        if ( ( ( ( this.actor.system.resources.laborers < 3 ) && ( e.system.itemType === "Laborer" ) ) || ( e.system.itemType !== "Laborer" ) ) &&
          ( ( ( this.actor.system.resources.alchemists < 3 ) && ( e.system.itemType === "Alchemist" ) ) || ( e.system.itemType !== "Alchemist" ) ) &&
          ( ( ( this.actor.system.resources.mercies < 3 ) && ( e.system.itemType === "Mercy" ) ) || ( e.system.itemType !== "Mercy" ) ) ) {
          html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
          html += `</label>`;
        }
      } else if ( e.type === "spies" ) {
        if( !this.actor.items.map( i => { return i.name } ).includes( e.name ) ) {
          html += `<input id="select-item-${ e._id }" type="${ input_type }" name="select_items" value="${ e._id }">`;
          html += `<label class="flex-horizontal" for="select-item-${ e._id }">`;
          html += `${ game.i18n.localize( e.name ) } <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${ game.i18n.localize( e.system.special ) }</span></i>`;
          html += `</label>`;
        }
      } else if ( e.type === "network" ) {
        if( !this.actor.items.map( i => { return i.name } ).includes( e.name ) &&
          ( ( this.actor.items.map( i => { return i.name } ).includes( e.system.requirements ) ) ||
          ( e.name === "Spy Network" ) ) ) {
          html += `<input id="select-item-${ e._id }" type="${ input_type }" name="select_items" value="${ e._id }">`;
          html += `<label class="flex-horizontal" for="select-item-${ e._id }">`;
          html += `${ game.i18n.localize( e.name ) } <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${ game.i18n.localize( e.system.description ) }</span></i>`;
          html += `</label>`;
        }
      } else if (e.type === "chosenability") {
        if ( e.system.class === this.actor.name ) {
          html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
          html += `</label>`;
        }
	    } else {
			  html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
			  html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
			  html += `${game.i18n.localize(e.name)} ${addition_price_load} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.description)}</span></i>`;
			  html += `</label>`;
	    }
    });

    html += `</div>`;

    let options = {
      // width: "500"
    }

		if ( this.actor.isOwner ) {
      let dialog = new Dialog({
        title: `${game.i18n.localize('BITD.Add')} ${game.i18n.localize('BITD.' + BoBHelpers.getProperCase(item_type) )}`,
        content: html,
        buttons: {
          one: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('BITD.Add'),
            callback: async () => await this.addItemsToSheet(item_type, $(document).find("#items-to-add"))
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
  }

  /* -------------------------------------------- */

  _onDeleteAllClick(event) {
    event.preventDefault();
    const item_type = $(event.currentTarget).data("itemType")

    let removeItems = BoBHelpers.getActorItemsByType( this.actor._id, item_type );
    let html = `<div class="band-of-blades" id="delete-dialog">Are you sure you want to delete all loadout items?</div>`;
    let options = {};

    if( ( removeItems.length !== 0 ) && ( this.actor.isOwner ) ) {
        let dialog = new Dialog( {
          title: `${ game.i18n.localize( 'BITD.DeleteAllLoadout' ) }`,
          content: html,
          buttons: {
            one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize( 'BITD.Delete' ),
              callback: async () => await this.actor.deleteEmbeddedDocuments("Item", removeItems )
            },
            two: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize( 'BITD.Cancel' ),
              callback: () => false
            }
          },
          default: "two"
        }, options );
        dialog.render( true );
    }
  }

_onFlagAddClick(event) {
  event.preventDefault();
	const item_type = $(event.currentTarget).data("itemType")
	const limiter = $(event.currentTarget).data("limiter")
	const distinct = $(event.currentTarget).data("distinct")
  let input_type = "checkbox";

  if (typeof distinct !== "undefined") {
    input_type = "radio";
  }

	let items = BoBHelpers.getAllActorsByType(item_type, game);
  let html = `<div class="band-of-blades" id="items-to-add">`;
  items.forEach(e => {
	  if (e.type === item_type) {
  	  html += `<input id="select-item-${e._id}" type="${input_type}" name="select_items" value="${e._id}">`;
      html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
      html += `${game.i18n.localize(e.name)} <i class="tooltip fas fa-question-circle"><span class="tooltiptext left">${game.i18n.localize(e.system.designation)}</span></i>`;
      html += `</label>`;
	  }
  });

  html += `</div>`;

  let options = {
    // width: "500"
  }

	if ( this.actor.isOwner ) {
    let dialog = new Dialog({
      title: `${game.i18n.localize('BITD.Add')} ${game.i18n.localize('BITD.' + BoBHelpers.getProperCase(item_type) )}`,
      content: html,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('BITD.Add'),
          callback: async () => await this.addFlagsToSheet(item_type, $(document).find("#items-to-add"))
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
}


  /* -------------------------------------------- */

  async addItemsToSheet(item_type, el) {
	  let items = await BoBHelpers.getAllItemsByType(item_type, game);
    let items_to_add = [];

    el.find("input:checked").each(function() {
		  items_to_add.push(items.find(e => e._id === $(this).val()));
    });
    if ( this.actor.isOwner ) {
		  await this.actor.createEmbeddedDocuments("Item", items_to_add);
	  }
  }

  /* -------------------------------------------- */

  async addFlagsToSheet(item_type, el) {
	  let items = BoBHelpers.getAllActorsByType(item_type, game);
	  let items_to_add = [];

    el.find("input:checked").each(function() {
		  items_to_add.push(items.find(e => e._id === $(this).val()));
    });

    if ( this.actor.isOwner ) {
	    await this.actor.setFlag("band-of-blades", item_type, items_to_add);
	  }
  }

  /* -------------------------------------------- */

  /**
   * Roll an Attribute die.
   * @param {*} event
   */
  async _onRollAttributeDieClick(event) {

    const attribute_name = $(event.currentTarget).data("rollAttribute");
    const att_obj = game.model.Actor.character.attributes;
    const resistance = Object.keys( att_obj );
    let actions = [];
    resistance.forEach( a => {
      let skill_obj = game.model.Actor.character.attributes[a].skills;
      actions.push( Object.keys( skill_obj ) );
    })
    actions = actions.flat();

    let roll_type;

    if ( actions.includes( attribute_name ) ) {
    	this.actor.rollActionPopup( attribute_name );
    } else {
    	if ( resistance.includes( attribute_name ) ) {
    		roll_type = "resistance";
			} else {
    		roll_type = attribute_name;
			}
    	await this.actor.rollSimplePopup( attribute_name, roll_type );
    }
  }

  /* -------------------------------------------- */
  async _onUpdateClick(event) {
	  event.preventDefault();
	  const item_type = $(event.currentTarget).data("itemType");
	  const limiter = $(event.currentTarget).data("limiter");

	  //find all items of type in world
	  const world_items = await BoBHelpers.getAllItemsByType(item_type, game);

	  //find all items of type attached to actor
	  let curr_items = this.actor.items.filter(i => i.type === item_type);

	  //find all items in world, but not attached to actor
	  const add_items = world_items.filter(({ name: id1 }) => !curr_items.some(({ name: id2 }) => id2 === id1));

	  //find all items attached to actor, but not in world
	  const rem_items = curr_items.filter(({ name: id1 }) => !world_items.some(({ name: id2 }) => id2 === id1));

	  const delete_items = rem_items.map( i => i.id );

    //delete all items attached to actor, but not in world
	  await this.actor.deleteEmbeddedDocuments("Item", delete_items);
	  //attach any new items
	  await this.actor.createEmbeddedDocuments("Item", add_items);
  }

/* -------------------------------------------- */
  async _onUpdateBoxClick(event) {
	  event.preventDefault();
	  const item_id = $(event.currentTarget).data("item");
	  let update_value = $(event.currentTarget).data("value");
    const update_type = $(event.currentTarget).data("utype");
    let update = {};

    if ( update_value === undefined) {
		  update_value = document.getElementById('fac-' + update_type + '-' + item_id).value;
	  }

	  if ( update_type === "heat" ) {
		  update = {_id: item_id, system:{heat:{value: update_value}}};
	  } else if ( update_type === "wanted" ) {
		  update = {_id: item_id, system:{wanted:{value: update_value}}};
	  } else if ( update_type === "status" ) {
	  	update = {_id: item_id, system:{status:{value: update_value}}};
	  } else if (update_type === "jobs" ) {
	  	update = {_id: item_id, system:{jobs:{value: update_value}}};
	  } else if (update_type === "is_damaged" ) {
	  	update = {_id: item_id, system:{is_damaged: update_value}};
	  } else {
	  	console.log("update attempted for type undefined in bob-sheet.js onUpdateBoxClick function");
		  return;
	  }

    await Item.updateDocuments([update], {parent: this});
  }
}
