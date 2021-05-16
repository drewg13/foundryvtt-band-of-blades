export class BoBHelpers {

  /**
   * Removes a duplicate item type from charlist.
   *
   * @param {Object} item_data
   * @param {Document} actor
   *
   */
  static async removeDuplicatedItemType(item_data, actor) {
    let dupe_list = [];
    let distinct_types = ["class", "heritage"];
    let should_be_distinct = distinct_types.includes(item_data.type);
    // If the Item has the exact same name - remove it from list.
    // Remove Duplicate items from the array.
    actor.items.forEach( i => {
      let has_double = (item_data.type === i.data.type);
      if (i.name === item_data.name || (should_be_distinct && has_double)) {
        dupe_list.push (i.id);
      }
    });
    await actor.deleteEmbeddedDocuments("Item", dupe_list);
  }

  /**
   * Adds default abilities when class is chosen for character
   *
   * @param {Object} item_data
   * @param {Document} actor
   */
  static addDefaultAbilities(item_data, actor) {

    let def_abilities = item_data.data.def_abilities || {};
    let abil_list = def_abilities.split(', ');
    let item_type = "";
    let items_to_add = [];

    if ( actor.data.type === "character" ) {
      item_type = "ability";
    } else if ( actor.data.type === "ship" ) {
      item_type = "crew_upgrade";
    }

    let abilities = actor.items.filter(a => a.type === item_type).map(e => {return e.data.name});

    if ( actor.data.type === "ship" ) {
      let size = actor.items.filter(a => a.type === "ship_size").map(e => {return e.data.name}) || [""];
      if ( size.length > 0 ) { abilities.push( size ); }
    }

    let items = BoBHelpers.getAllItemsByType(item_type, game);

    if ( actor.data.type === "ship" ) {
      let all_sizes = BoBHelpers.getAllItemsByType("ship_size", game);
      all_sizes.forEach( s => { items.push( s ); });
    }

    let trim_abil_list = abil_list.filter( x => !abilities.includes( x ) );
    trim_abil_list.forEach(i => {
      items_to_add.push( items.find( e => ( e.name === i ) ));
    });

    actor.createEmbeddedDocuments("Item", items_to_add);
  }


  /**
   * Add item modification if logic exists.
   * @param {Object} item_data
   * @param {Document} document
   */
  static async callItemLogic(item_data, document) {

    let items = item_data.data || {};
    if ('logic' in items && items.logic !== '') {
      let logic = JSON.parse(items.logic);
      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

        let logic_update = { "_id": document.data._id };
        logic.forEach( expression => {
          // Different logic behav. dep on operator.
          switch (expression.operator) {

            // Add when creating.
            case "addition":
              foundry.utils.mergeObject(
                logic_update,
                {[expression.attribute]: Number(BoBHelpers.getNestedProperty(document.data, expression.attribute)) + expression.value}
              );
              break;

            // Change name property.
            case "attribute_change":
              foundry.utils.mergeObject(
                logic_update,
                {[expression.attribute]: expression.value}
              );
              break;

          }
        });
        await Actor.updateDocuments( [logic_update] );
    }
  }

  /**
   * Undo Item modifications when item is removed.
   * @param {Object} item_data
   * @param {Document} document
   */
  static async undoItemLogic(item_data, document) {

    let items = item_data.data || {};

    if ( ('logic' in items) && (items.logic !== '') ) {
      let logic = JSON.parse(items.logic)

      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

      if (logic) {
        let logic_update = { "_id": document.data._id };
        let entity_data = document.data;

        logic.forEach(expression => {
          // Different logic behav. dep on operator.
          switch (expression.operator) {

            // Subtract when removing.
            case "addition":
              foundry.utils.mergeObject(
                logic_update,
                {[expression.attribute]: Number(BoBHelpers.getNestedProperty(document.data, expression.attribute)) - expression.value},
                {insertKeys: true}
              );
              break;

            // Change name back to default.
            case "attribute_change":
              // Get the array path to take data.
              let default_expression_attribute_path = expression.attribute + '_default';
              let default_name = default_expression_attribute_path.split(".").reduce((o, i) => o[i], entity_data);

              foundry.utils.mergeObject(
                logic_update,
                {[expression.attribute]: default_name},
				        {insertKeys: true}
              );
              break;
          }
        });
		    await Actor.updateDocuments( [logic_update] );
      }
    }
  }

  /**
   * Get a nested dynamic attribute.
   * @param {Object} obj
   * @param {string} property
   */
  static getNestedProperty(obj, property) {
    return property.split('.').reduce((r, e) => {
        return r[e];
    }, obj);
  }


  /**
   * Add item functionality
   */
  static _addOwnedItem(event, actor) {

    event.preventDefault();
    const a = event.currentTarget;
    const item_type = a.dataset.itemType;

    let data = {
      name: randomID(),
      type: item_type
    };
    return actor.createEmbeddedDocuments("Item", [data]);
  }

  /**
   * Get the list of all available ingame items by Type.
   *
   * @param {string} item_type
   * @param {Object} game
   */
  static async getAllItemsByType(item_type, game) {

    let game_items = game.items.filter(e => e.type === item_type).map(e => {return e.data}) || [];
    let pack = game.packs.find(e => e.metadata.name === item_type);
    let compendium_content;

    compendium_content = await pack.getDocuments();

    let compendium_items = compendium_content.map(k => {return k.data}) || [];
    compendium_items = compendium_items.filter(a => game_items.filter(b => a.name === b.name && a.name === b.name).length === 0);

    let list_of_items = game_items.concat(compendium_items) || [];
    list_of_items.sort(function(a, b) {
      let nameA = a.name.toUpperCase();
      let nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    return list_of_items;
  }
  /* -------------------------------------------- */

  static async getAllActorsByType(item_type, game) {
    return game.actors.filter( e => e.data.type === item_type ).map( e => { return e.data } ) || [];
  }

  /* -------------------------------------------- */

  static getProperCase( name ) {
    return name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
  }

  /* -------------------------------------------- */
  /**
   * Returns the label for attribute.
   *
   * @param {string} attribute_name
   * @returns {string}
   */
  static getAttributeLabel(attribute_name) {
    // Calculate Dice to throw.
    let attribute_labels = {};
    let attributes = {};

    // There has to be a better way to to do this
    // @todo - pull skill list dynamically
    const skills = ["insight","doctor","hack","rig","study","prowess","helm","scramble","scrap","skulk","resolve","attune","command","consort","sway"];
    const systems = ["crew","upkeep","engines","comms","weapons","hull","shields","encryptor"];

    if (skills.indexOf(attribute_name) !== -1 ) {
      attributes = game.system.model.Actor.character.attributes;
    } else if (systems.indexOf(attribute_name) !== -1 ) {
      attributes = game.system.model.Actor.ship.systems;
    } else {
      return BoBHelpers.getProperCase(attribute_name);
    }

    for (const a in attributes) {
      attribute_labels[a] = attributes[a].label;
      for (const skill_name in attributes[a].skills) {
        attribute_labels[skill_name] = attributes[a].skills[skill_name].label;
      }
    }

    return attribute_labels[attribute_name];
  }

  /* -------------------------------------------- */

  /**
   * Creates options for faction clocks.
   *
   * @param {int[]} sizes
   *  array of possible clock sizes
   * @param {int} default_size
   *  default clock size
   * @param {int} current_size
   *  current clock size
   * @returns {string}
   *  html-formatted option string
   */
  static createListOfClockSizes( sizes, default_size, current_size ) {

    let text = ``;

    sizes.forEach( size => {
      text += `<option value="${size}"`;
      if ( !( current_size ) && ( size === default_size ) ) {
        text += ` selected`;
      } else if ( size === current_size ) {
        text += ` selected`;
      }

      text += `>${size}</option>`;
    });

    return text;

  }
}
