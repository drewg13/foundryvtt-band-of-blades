import { BoBActor } from "./bob-actor.js";

export class BoBHelpers {

  /**
   * Identifies duplicate items by type and returns a array of item ids to remove
   *
   * @param {Object} item_data
   *   data of item being added
   * @param {Document} actor
   *   actor item is being added to
   * @returns {Array}
   *   array of items present on actor that should be distinct to be removed
   *
   */
  static removeDuplicatedItemType( item_data, actor ) {
    let dupe_list = [];
    let distinct_types = [ "class", "role", "chosen", "heritage", "squad" ];
    let allowed_types = [ "item", "materiel", "personnel" ];
    let should_be_distinct = distinct_types.includes( item_data.type );
    // If the Item has the exact same name - remove it from list.
    // Remove Duplicate items from the array.
    actor.items.forEach( i => {
      let has_double = ( item_data.type === i.type );
      if( ( ( i.name === item_data.name ) || ( should_be_distinct && has_double ) ) && !( allowed_types.includes( item_data.type ) ) && ( item_data._id !== i.id ) ) {
        dupe_list.push( i.id );
      }
    } );

    return dupe_list;
  }

  /* -------------------------------------------- */

  /**
   * Adds default abilities when class is chosen for character
   *
   * @param {Object} item_data
   *   data of item containing default abilities
   * @param {Document} actor
   *   data of actor to add abilities to
   */
  static async addDefaultAbilities( item_data, actor ) {

    let def_abilities = item_data.system.def_abilities || {};
    let abil_list = def_abilities.split( ', ' );
    let item_type = "";
    let items_to_add = [];

    if( actor.type === "character" ) {
      item_type = "ability";
    } else if( actor.type === "role" ) {
      item_type = "network";
    } else if( actor.type === "chosen" ) {
      item_type = "chosenability";
    } else {
      return
    }

    let abilities = actor.items.filter( a => a.type === item_type ).map( e => {
      return e.name
    } );
    let items = await BoBHelpers.getAllItemsByType( item_type, game );
    let trim_abil_list = abil_list.filter( x => !abilities.includes( x ) );
    trim_abil_list.forEach( i => {
      if( items.find( e => ( e.name === i ) ) !== undefined ) {
        items_to_add.push( items.find( e => ( e.name === i ) ) );
      } else {
        ui.notifications.warn( game.i18n.localize("BITD.AddUpgradesWarn") )
      }
    } );

    await actor.createEmbeddedDocuments( "Item", items_to_add );
  }

  /* -------------------------------------------- */

  /**
   * Get a nested dynamic attribute.
   * @param {Object} obj
   * @param {string} property
   */
  static getNestedProperty( obj, property ) {
    return property.split( '.' ).reduce( ( r, e ) => {
      return r[e];
    }, obj );
  }

  /* -------------------------------------------- */

  /**
   * Create a set of default Rookie characters in a set squad
   * @param {string} squad
   * @param {number} number
   * @returns {Document[]} array of created Documents
   */
  static async createRookies( squad, number ) {
    let folder;
    const squads = await BoBHelpers.getAllItemsByType( "squad", game );
    const squadItem = squads.filter( s => s.name === squad ) || {};
    const defaultClassName = "Rookie";
    const classes = await BoBHelpers.getAllItemsByType( "class", game );
    const classItem = classes.find( c => c.name === defaultClassName ) || {};

    if( game.folders.find( f => f.name === squad ) === undefined ) {
      folder = await Folder.create( {
        name: squad,
        type: "Actor"
      } );
    } else {
      folder = game.folders.find( f => f.name === squad );
    }

    let createData = [];
    for( let i = 1; i < number + 1; i++ ) {
      let name = squad + " " + i;
      let data = {
        name: name,
        type: "character",
        folder: folder,
        data: {
          class: "Rookie",
          squad: squad,
          "attributes.prowess.skills.maneuver.value": "1",
          "attributes.prowess.skills.skirmish.value": "1",
          "attributes.resolve.skills.consort.value": "1"
        }
      }
      data.items = [];
      data.items = data.items.concat( squadItem );
      data.items = data.items.concat( classItem );
      createData.push( data );
    }

    let created = await BoBActor.create( createData );

    let marshals = game.actors.filter( a => a.system.type === "Marshal" ).map( a => {
      return a.id
    } );
    marshals.forEach( m => {
      game.actors.get( m ).sheet.render( false );
    } );

    return created;
  }

  /* -------------------------------------------- */

  /**
   * Get the list of all available in-game items by Type.
   *
   * @param {string} item_type
   *   item type of interest
   * @param {Object} game
   *   game world object
   * @returns {Array[Object]}
   *   an array of copy-safe objects matching the supplied item type present in the game, favoring in-world items over compendium items with the same name
   */
  static async getAllItemsByType( item_type, game ) {

    let game_items = game.items.filter( e => e.type === item_type ).map( e => {
      return e.toObject()
    } ) || [];
    let pack = game.packs.find( e => e.metadata.name === item_type );
    let compendium_content;

    compendium_content = await pack.getDocuments();

    let compendium_items = compendium_content.map( k => {
      return k.toObject()
    } ) || [];
    compendium_items = compendium_items.filter( a => game_items.filter( b => a.name === b.name && a.name === b.name ).length === 0 );

    let list_of_items = game_items.concat( compendium_items ) || [];
    list_of_items.sort( function( a, b ) {
      let nameA = a.name.toUpperCase();
      let nameB = b.name.toUpperCase();
      return nameA.localeCompare( nameB );
    } );
    return list_of_items;
  }

  /* -------------------------------------------- */

  /**
   * Returns an array of actor objects matching the type passed which are present in the game world
   *
   * @param {string} actor_type
   *   the actor type of interest
   * @param {Object} game
   *   current game world object
   * @returns {Array}
   *   an array of copy-safe actor objects of the specified type in the game world
   */
  static getAllActorsByType( actor_type, game ) {
    return game.actors.filter( e => e.type === actor_type ).map( e => {
      return e.toObject()
    } ) || [];
  }

  /* -------------------------------------------- */

  /**
   * Returns an array of character objects matching the class passed which are present in the game world
   *
   * @param {string} actor_class
   *   the character class of interest
   * @param {Object} game
   *   current game world object
   * @returns {Array}
   *   an array of raw ActorData objects of the specified class in the game world
   */
  static getAllCharactersByClass( actor_class, game ) {
    return game.actors.filter( e => e.system.class === actor_class ).map( e => {
      return e
    } ) || [];
  }

  /* -------------------------------------------- */

  /**
   * Returns an array of item ids of items matching the type passed which are present on the actor passed
   *
   * @param {string} actorId
   *   the id of the actor
   * @param {string} itemType
   *   the item type of interest
   * @returns {Array}
   *   an array of item ids present on actor of item type
   */
  static getActorItemsByType( actorId, itemType ) {
    let actor = game.actors.get( actorId );
    return actor.items.filter( i => i.type === itemType ).map( i => i.id ) || [];
  }

  /* -------------------------------------------- */

  /**
   * Returns the string passed with the first letter capitalized
   *
   * @param {string} name
   *   a string to be capitalized
   * @returns {string}
   *   the capitalized string
   */
  static getProperCase( name ) {
    return name.charAt( 0 ).toUpperCase() + name.substr( 1 ).toLowerCase();
  }

  /* -------------------------------------------- */

  /**
   * Returns the label for attribute.
   *
   * @param {string} attribute_name
   *   the attribute of interest
   * @returns {string}
   *   the label to display for the passed attribute
   */
  static getAttributeLabel( attribute_name ) {
    // Calculate Dice to throw.
    let attribute_labels = {};
    let attributeObj = {};
    let skills = [];

    const attributes = Object.keys( game.system.model.Actor.character.attributes );
    if( attributes[attributes.length - 1] === "specialist" ) {
      attributes.pop();
    }
    attributes.forEach( a => {
      skills.push( a );
      Object.keys( game.system.model.Actor.character.attributes[a].skills ).forEach( s => {
        skills.push( s );
      } )
    } );

    if( skills.indexOf( attribute_name ) !== -1 ) {
      attributeObj = game.system.model.Actor.character.attributes;
    } else {
      return game.i18n.localize( "BITD." + BoBHelpers.getProperCase( attribute_name ) );
    }

    for( const a in attributeObj ) {
      attribute_labels[a] = attributeObj[a].label;
      for( const s in attributeObj[a].skills ) {
        attribute_labels[s] = attributeObj[a].skills[s].label;
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
      text += `<option value="${ size }"`;
      if( !( current_size ) && ( size === default_size ) ) {
        text += ` selected`;
      } else if( size === current_size ) {
        text += ` selected`;
      }

      text += `>${ size }</option>`;
    } );

    return text;

  }

  /**
   * Creates options for faction clocks.
   *
   * @param {int[]} colors
   *  array of possible clock colors
   * @param {int} default_color
   *  default clock color
   * @param {int} current_color
   *  current clock color
   * @returns {string}
   *  html-formatted option string
   */
  static createListOfClockColors( colors, default_color, current_color ) {

    let text = ``;

    colors.forEach( color => {
      text += `<option value="${ color }"`;
      if( !( current_color ) && ( color === default_color ) ) {
        text += ` selected`;
      } else if( color === current_color ) {
        text += ` selected`;
      }

      text += `>${ color }</option>`;
    } );

    return text;

  }

  /**
   * Create a Macro from a Roll drop.
   * Get an existing roll macro if one exists, otherwise create a new one.
   * @param {Object} data     The dropped data
   * @param {number} slot     The hotbar slot to use
   * @returns {Promise}
   */
  static async createBoBMacro( data, slot ) {
    if( data.type !== "Roll" ) return;
    if( !( "data" in data ) ) return ui.notifications.warn( "You can only create macro buttons for Rolls at this time" );
    const item = data.data;

    // Create the macro command
    const command = `if(actor){canvas.tokens.controlled[0].actor.rollActionPopup("${ item }");} else {ui.notifications.warn( "Select a token before executing this macro" );}`;
    let macro = game.macros.contents.find( m => ( m.name === item ) && ( m.command === command ) );
    let img = `systems/band-of-blades/styles/assets/icons/roll_${ item }.svg`;
    if( !macro ) {
      macro = await Macro.create( {
        name: BoBHelpers.getProperCase( item ),
        type: "script",
        img: img,
        command: command,
      } );
    }
    await game.user.assignHotbarMacro( macro, slot );
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Creates a chat notification on a resource change
   *
   * @param {string} actor
   *  actor on which change occurred
   * @param {string} resource
   *  localized resource name
   * @param {int} oldValue
   *  original resource value
   * @param {int} newValue
   *  new resource value
   */
  static chatNotify( actor, resource, oldValue, newValue ) {
    let change;
    if ( newValue > oldValue ) {
      change = '+' + String (newValue - oldValue);
    } else {
      change = String (newValue - oldValue);
    }
    let color = newValue >= oldValue ? 'green' : 'red'
    let message = `<div class="resource-chat-notification">${actor}<table><tr><td>${resource}</td><td class="value">${oldValue}</td><td class="arrow"><i class="fas fa-arrow-right"></i></td><td class="value"><span class="${color}">${newValue}</span></td><td><span class="small">(${change})</span></td></tr></table></div>`;
    ChatMessage.create({content: message});
  }
}